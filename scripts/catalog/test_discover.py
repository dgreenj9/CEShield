"""Offline fixtures for provider extraction. Run: python3 -m unittest discover -s scripts/catalog -p 'test_*.py'."""
import unittest
import json
from unittest.mock import patch
from urllib.error import URLError
from datetime import datetime, timezone
from discover import PageParser, SourceClient, canonical_url, clean_title, publishable, upcoming_session, detail_queue, discover, structured_course_links, continued_catalog_pages, provider_reported_facts


class CatalogExtractionTests(unittest.TestCase):
    def test_reported_duration_and_level_do_not_become_ce_hours_or_approvals(self):
        facts = provider_reported_facts({'durationHours': 1, 'durationMinutes': 30, 'instructionalLevel': 'INTERMEDIATE_LEVEL', 'courseFormats': [{'type':'VIDEO_RECORDED'}, {'type':'LIVE'}]}, 'https://example.org/course')
        self.assertEqual(facts['durationMinutes'], 90)
        self.assertEqual(facts['level'], 'intermediate')
        self.assertEqual(facts['formats'], ['liveOnline', 'online'])
        self.assertNotIn('contactHours', facts)
        self.assertNotIn('ceApprovals', facts)
        for hours, minutes in [(True, 0), ('1', 0), (-1, 0), (1, 60), (1001, 0), (None, None)]:
            self.assertIsNone(provider_reported_facts({'durationHours':hours,'durationMinutes':minutes}, 'https://example.org/course')['durationMinutes'])
        self.assertIsNone(provider_reported_facts({'instructionalLevel':'expert'}, 'https://example.org/course')['level'])

    def test_public_api_follows_bounded_pages_and_imports_only_published_course_links(self):
        provider = {'id': 'ot', 'catalogUrl': 'https://ot.example/courses/all', 'publicCatalogApi': {
            'kind': 'continued-search', 'url': 'https://athena-api-prod.continued.com/', 'learningSpacePath': 'occupational-therapy'}}
        requests = []
        class FakeClient:
            def request(self, url, **kwargs):
                requests.append(kwargs)
                n = kwargs['json_body']['variables']['page']
                rows = [{'title': 'School participation', 'slug': f'school-{n}', 'courseFormats': [{'type': 'VIDEO_RECORDED'}]},
                        {'title': 'Unpublished', 'slug': 'hidden', 'courseFormats': []},
                        {'title': 'Offsite', 'slug': '//outside.example/course', 'courseFormats': [{}]}]
                return json.dumps({'data': {'searchCourses': {'data': rows, 'paginatorInfo': {'currentPage': n, 'hasMorePages': n < 2}}}}), url
        with patch('discover.SourceClient', return_value=FakeClient()):
            pages = list(continued_catalog_pages(provider, 1))
            self.assertEqual(pages, [(1, [('https://ot.example/courses/school-1', 'School participation')], True)])
            self.assertEqual(len(list(continued_catalog_pages(provider, 10))), 2)
        for request in requests:
            self.assertEqual(request['headers'], {'X-Learning-Space-Path': 'occupational-therapy'})
            self.assertNotIn('userEnrollment', request['json_body']['query'])
            self.assertNotIn('mutation', request['json_body']['query'])

    def test_public_api_rejects_changed_shapes_graphql_errors_and_repeated_pages(self):
        provider = {'catalogUrl': 'https://ot.example/courses/all', 'publicCatalogApi': {
            'kind': 'continued-search', 'url': 'https://athena-api-prod.continued.com/', 'learningSpacePath': 'occupational-therapy'}}
        class FakeClient:
            payload = None
            def request(self, url, **kwargs):
                if self.payload is not None:
                    return json.dumps(self.payload), url
                n = kwargs['json_body']['variables']['page']
                return json.dumps({'data': {'searchCourses': {'data': [{'slug': 'same', 'title': 'Same course', 'courseFormats': [{}]}], 'paginatorInfo': {'currentPage': n, 'hasMorePages': True}}}}), url
        client = FakeClient()
        with patch('discover.SourceClient', return_value=client):
            for payload in [[], {'errors': [{'message': 'denied'}]}, {'data': None}, {'data': {'searchCourses': {'data': [], 'paginatorInfo': None}}}]:
                client.payload = payload
                with self.assertRaises(ValueError):
                    list(continued_catalog_pages(provider, 2))
            client.payload = None
            with self.assertRaisesRegex(ValueError, 'repeated'):
                list(continued_catalog_pages(provider, 2))

    def test_api_failure_keeps_successful_catalog_findings_and_marks_coverage_incomplete(self):
        provider = {'id': 'ot', 'catalogUrl': 'https://ot.example/catalog', 'courseUrlPattern': '/courses/',
                    'publicCatalogApi': {'url': 'https://athena-api-prod.continued.com/'}, 'sitemapDiscovery': False}
        class FakeClient:
            origin, sitemaps = 'https://ot.example', []
            def allowed_host(self, url):
                return url.startswith(self.origin + '/')
            def request(self, url):
                return '<a href="/courses/feeding">Pediatric feeding</a>', url
        def pages(*args):
            yield 1, [('https://ot.example/courses/school', 'School participation')], True
            raise URLError('Temporary outage')
        with patch('discover.SourceClient', return_value=FakeClient()), patch('discover.continued_catalog_pages', side_effect=pages):
            coverage, listings, _, _ = discover(provider, 0, 0, max_catalog_pages=20)
        self.assertEqual(len(listings), 2)
        self.assertTrue(coverage['apiPaginationPending'])
        self.assertEqual(coverage['apiPagesFetched'], 1)
        self.assertTrue(coverage['errors'])

    def test_provider_host_does_not_include_other_tenants_or_unregistered_subdomains(self):
        client = SourceClient.__new__(SourceClient)
        client.domain = 'learnphysio.teachable.com'
        self.assertTrue(client.allowed_host('https://learnphysio.teachable.com/p/course'))
        self.assertFalse(client.allowed_host('https://other.teachable.com/p/course'))
        self.assertFalse(client.allowed_host('https://teachable.com/p/course'))
        client.domain = 'northernspeech.com'
        self.assertTrue(client.allowed_host('https://www.northernspeech.com/online-ceus'))
        self.assertFalse(client.allowed_host('https://northernspeech.com.example.org/'))
    def test_nested_title_and_entities(self):
        page = PageParser()
        page.feed('<h1>Feeding &amp; Swallowing</h1><a href="/course/1"><strong>Adult</strong> dysphagia assessment</a>')
        self.assertEqual(''.join(page.h1), 'Feeding & Swallowing')
        self.assertEqual(clean_title(page.links[0][1]), 'Adult dysphagia assessment')

    def test_navigation_and_block_pages_are_not_courses(self):
        for title in ['View More Sessions', 'Learn More', 'All Courses', 'Just a moment...', '404 Page Not Found', '(Private) Hand Therapy Workshop', '5 415 415 Reviews']:
            self.assertIsNone(clean_title(title), title)
        self.assertEqual(clean_title('Introduction to Hand Therapy'), 'Introduction to Hand Therapy')
        self.assertEqual(clean_title('OT and AI'), 'OT and AI')
        self.assertEqual(clean_title('Hearing Aid Selection and Fitting'), 'Hearing Aid Selection and Fitting')

    def test_structured_courses_do_not_import_prices_ratings_or_unregistered_aliases(self):
        data = {'@type': 'ItemList', 'itemListElement': [
            {'@type': 'Course', 'name': 'Handwriting strategies', 'url': 'https://parent.example/courses/handwriting', 'offers': {'price': 129}, 'aggregateRating': {'ratingValue': 5}},
            {'@type': 'CourseInstance', 'name': 'Live session', 'url': 'https://parent.example/session'},
            {'@type': 'Course', 'name': 'Other host', 'url': 'https://other.example/course'},
        ]}
        links = structured_course_links(data, {'https://parent.example': 'https://ot.example'})
        self.assertEqual(links, [('https://ot.example/courses/handwriting', 'Handwriting strategies'), ('https://other.example/course', 'Other host')])
        self.assertEqual(structured_course_links(data)[0][0], 'https://parent.example/courses/handwriting')

    def test_pagination_is_bounded_same_host_and_does_not_follow_arbitrary_links(self):
        provider = {'id': 'example', 'catalogUrl': 'https://example.org/all', 'courseUrlPattern': '/course/',
                    'catalogPaginationPattern': '/all/page:\\d+', 'sitemapDiscovery': False}
        class FakeClient:
            origin, sitemaps = 'https://example.org', []
            def __init__(self):
                self.visited = []
            def allowed_host(self, url):
                return url.startswith('https://example.org/')
            def request(self, url):
                self.visited.append(url)
                if url.endswith('/all'):
                    return '<a href="/course/one">Aphasia assessment</a><a href="/course/one#reviews">5 300 Reviews</a><a href="/all/page:2/">Next →</a><a href="https://other.org/all/page:3">Next</a><a href="/account">Next</a>', url
                return '<a href="/course/two">Swallowing assessment</a><a href="/all/page:2">Next →</a>', url
        client = FakeClient()
        with patch('discover.SourceClient', return_value=client):
            coverage, listings, _, _ = discover(provider, 0, 0, max_catalog_pages=1)
            self.assertEqual(len(listings), 1)
            self.assertEqual(listings[0]['title'], 'Aphasia assessment')
            self.assertTrue(coverage['catalogPaginationPending'])
            client.visited = []
            coverage, listings, _, _ = discover(provider, 0, 0, max_catalog_pages=10)
            self.assertEqual(len(listings), 2)
            self.assertEqual(client.visited, ['https://example.org/all', 'https://example.org/all/page:2'])
            self.assertFalse(coverage['catalogPaginationPending'])

    def test_course_heading_excludes_card_ratings_instructors_and_approval_badges(self):
        page = PageParser()
        page.feed('<a href="/course/stroke"><span>4.8</span><h3>Neuro Recovery After Stroke</h3><p>Henry Hoffman</p><span>1 Hour Approved</span></a>')
        self.assertEqual(page.links[0][1], 'Neuro Recovery After Stroke')

    def test_detail_title_excludes_later_promotional_headings(self):
        page = PageParser()
        page.feed('<h1> </h1><h1>Bilingual <span>Assessment</span></h1><h1>Join Our Community!</h1>')
        self.assertEqual(''.join(page.h1), 'Bilingual Assessment')

    def test_closed_enrollment_is_not_a_publishable_opportunity(self):
        page = PageParser()
        page.feed('<script>"This course is closed for enrollment"</script><style>.closed{}</style><h2>This course is open</h2>')
        self.assertNotIn('closed for enrollment', ' '.join(page.page_text))
        self.assertFalse(publishable({'title': 'Pediatric feeding course', 'url': 'https://example.org/course/feeding', 'availability': 'closed'}))

    def test_successful_detail_check_records_closure_and_failed_refresh_preserves_it(self):
        url = 'https://example.org/course/feeding'
        provider = {'id': 'example', 'catalogUrl': 'https://example.org/catalog', 'courseUrlPattern': '/course/'}
        class FakeClient:
            origin, sitemaps = 'https://example.org', []
            failing = False
            def allowed_host(self, value):
                return value.startswith('https://example.org/')
            def request(self, value):
                if value.endswith('/catalog'):
                    return '<a href="/course/feeding">Pediatric feeding course</a>', value
                if self.failing:
                    raise URLError('Temporary outage')
                return '<h1>Pediatric feeding course</h1><h2>This course is closed for enrollment.</h2>', value
        client = FakeClient()
        with patch('discover.SourceClient', return_value=client):
            _, listings, _, closed = discover(provider, 1, 0, refresh_titles=True)
            self.assertEqual(listings, [])
            self.assertEqual(closed[0]['availability'], 'closed')
            client.failing = True
            _, listings, _, retained = discover(provider, 1, 0, refresh_titles=True, known={url: closed[0]})
            self.assertEqual(listings, [])
            self.assertEqual(retained[0]['availability'], 'closed')

    def test_tracking_dedup_preserves_offering_identity(self):
        self.assertEqual(canonical_url('https://Example.org/course/?utm_source=x&session=2#top'), 'https://example.org/course?session=2')
        self.assertNotEqual(canonical_url('https://example.org/course?session=1'), canonical_url('https://example.org/course?session=2'))
        self.assertIsNone(canonical_url('javascript:alert(1)'))
        self.assertIsNone(canonical_url('https://example.org/course/one</a>, "another course"'))

    def test_expired_and_undated_events_are_not_published_as_course_opportunities(self):
        event = {'title': 'Pediatric feeding workshop', 'url': 'https://example.org/events/feeding'}
        self.assertFalse(publishable(event))
        self.assertFalse(publishable({**event, 'sessionStart': '2020-01-01'}))
        self.assertTrue(publishable({**event, 'sessionStart': '2099-01-01'}))
        self.assertFalse(publishable({'title': 'Advanced hand therapy', 'url': 'https://example.org/archived-course'}))
        dated = {'title': 'Advanced hand therapy - Live Webinar', 'url': 'https://example.org/courses/2020-01-01/hand-therapy'}
        self.assertFalse(publishable(dated))
        self.assertTrue(publishable({**dated, 'title': 'Advanced hand therapy - On-Demand'}))
        self.assertEqual(upcoming_session([{'@type': 'Event', 'startDate': '2020-01-01'}]), {})
        self.assertEqual(upcoming_session([{'@type': 'Event', 'startDate': '2099-01-01'}])['sessionStart'], '2099-01-01')

    def test_bounded_import_advances_past_known_courses(self):
        one, two = 'https://example.org/course/one', 'https://example.org/course/two'
        candidates = {url: {'url': url, 'title': None, 'sourceUrl': 'https://example.org/sitemap.xml'} for url in (one, two)}
        known = {one: {'url': one, 'title': 'Pediatric feeding', 'sourceUrl': one, 'discoveredOn': '2026-01-01'}}
        self.assertEqual([x['url'] for x in detail_queue(candidates, known, {}, 1)], [two])
        self.assertEqual(candidates[one]['sourceUrl'], one)
        self.assertEqual(candidates[one]['discoveredOn'], '2026-01-01')

    def test_recent_failure_does_not_starve_new_candidates_and_can_be_retried(self):
        urls = ['https://example.org/course/one', 'https://example.org/course/two']
        candidates = {url: {'url': url, 'title': None} for url in urls}
        attempts = {urls[0]: {'attemptedAt': datetime.now(timezone.utc).isoformat(), 'entry': candidates[urls[0]]}}
        self.assertEqual([x['url'] for x in detail_queue(candidates, {}, attempts, 1)], [urls[1]])
        self.assertEqual([x['url'] for x in detail_queue(candidates, {}, attempts, 1, retry_days=0)], [urls[0]])

    def test_dry_run_results_can_be_reused_without_repeated_network_requests(self):
        url = 'https://example.org/course/one'
        candidates = {url: {'url': url, 'title': None}}
        attempts = {url: {'entry': {'url': url, 'title': 'Pediatric feeding', 'sourceUrl': url}}}
        self.assertEqual(detail_queue(candidates, {}, attempts, 1), [])
        self.assertEqual(candidates[url]['title'], 'Pediatric feeding')
        self.assertEqual(len(detail_queue(candidates, {}, attempts, 1, refresh=True)), 1)


if __name__ == '__main__':
    unittest.main()
