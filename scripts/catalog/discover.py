#!/usr/bin/env python3
"""Discover public education listings. Never assigns scores, CE approval, or availability.

python3 scripts/catalog/discover.py --publish --details 20
Defaults to an artifact for review; --publish updates only discovered listings and coverage.
Provider additions belong in providers.json. The curated course file is never modified.
"""
import argparse
import fcntl
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import hashlib
from html import unescape
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import ssl
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlsplit, urlunsplit, parse_qsl, urlencode
from urllib.request import Request, urlopen
from urllib.robotparser import RobotFileParser
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'src/data/education'
AGENT = 'CEShieldCatalog/0.1 (+https://www.ceshield.com/about)'
# python.org macOS installations may not have run Install Certificates.command.
# Use the system trust bundle when Python has no configured one; never disable TLS verification.
TLS = ssl.create_default_context(cafile='/etc/ssl/cert.pem' if not ssl.get_default_verify_paths().cafile and Path('/etc/ssl/cert.pem').exists() else None)


def canonical_url(url):
    url = unescape(url)
    if re.search(r'[<>"\x00-\x20]', url):
        return None
    p = urlsplit(url)
    if p.scheme not in ('http', 'https') or not p.hostname or p.username or p.password:
        return None
    query = [(k, v) for k, v in parse_qsl(p.query, keep_blank_values=True)
             if not k.lower().startswith('utm_') and k.lower() not in ('fbclid', 'gclid', 'ref', 'referral', 'internalad', 'cacheminutes')]
    return urlunsplit((p.scheme, p.netloc.lower(), p.path.rstrip('/') or '/', urlencode(sorted(query)), ''))


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links, self.link, self.h1, self.title = [], None, [], []
        self.in_h1 = self.in_title = False
        self.h1_parts = []
        self.page_text = []
        self.ignored_text_tag = None
        self.link_heading = None
        self.canonical = None
        self.json_ld, self.json_parts, self.in_json = [], [], False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ('script', 'style'):
            self.ignored_text_tag = tag
        if tag == 'a' and a.get('href'):
            self.link = {'href': a['href'], 'parts': [], 'heading': [], 'fallback': a.get('aria-label') or a.get('title', '')}
        if self.link is not None and tag in ('h1', 'h2', 'h3', 'h4', 'h5', 'h6'):
            self.link_heading = tag
        if tag == 'h1':
            self.in_h1 = True
            self.h1_parts = []
        if tag == 'title':
            self.in_title = True
        if tag == 'link' and a.get('rel') == 'canonical':
            self.canonical = a.get('href')
        if tag == 'script' and a.get('type', '').lower() == 'application/ld+json':
            self.in_json, self.json_parts = True, []

    def handle_data(self, data):
        if not self.ignored_text_tag:
            self.page_text.append(data)
        if self.link is not None:
            self.link['parts'].append(data)
            if self.link_heading:
                self.link['heading'].append(data)
        if self.in_h1:
            self.h1_parts.append(data)
        if self.in_title:
            self.title.append(data)
        if self.in_json:
            self.json_parts.append(data)

    def handle_endtag(self, tag):
        if tag == self.ignored_text_tag:
            self.ignored_text_tag = None
        if tag == 'a' and self.link is not None:
            text = ' '.join(self.link['heading']).strip() or ' '.join(self.link['parts']).strip() or self.link['fallback']
            self.links.append((self.link['href'], text))
            self.link = None
            self.link_heading = None
        if tag == self.link_heading:
            self.link_heading = None
        if tag == 'h1':
            if not ''.join(self.h1).strip():
                self.h1 = self.h1_parts
            self.in_h1 = False
        if tag == 'title':
            self.in_title = False
        if tag == 'script' and self.in_json:
            try:
                self.json_ld.append(json.loads(''.join(self.json_parts)))
            except (ValueError, TypeError):
                pass
            self.in_json = False


def clean_title(text):
    text = re.sub(r'\s+', ' ', unescape(text)).strip()
    text = re.sub(r'\s+\$\s*[\d,.]+(?:\s+\$\s*[\d,.]+)*$', '', text)
    text = re.sub(r'^Herman & Wallace Pelvic Rehabilitation Continuing Education\s*[-–]\s*', '', text)
    text = re.sub(r'\s+Instagram Facebook LinkedIn YouTube$', '', text)
    text = re.sub(r'\s+(?:Course )?Path \d+-instagram.*$', '', text)
    text = re.sub(r'\s+Insert/edit link\b.*$', '', text, flags=re.I)
    text = re.sub(r'\s+\|\s+(?:OT|PT|SLP)\s+CE.*$', '', text)
    text = re.sub(r'\s+Join the SLP Impact Community!.*$', '', text)
    text = re.sub(r'\s*→$', '', text)
    text = re.sub(r'^CIAO Seminars\s*[-–]\s*', '', text)
    text = re.sub(r'(?:^|\s)#e\d+\b', '', text, flags=re.I).strip()
    text = re.split(r'\s+(?:This comprehensive course|Our foundational course)', text)[0]
    text = re.sub(r'^(?:View Course|View Details|Learn More)\s*[:\-]?\s*', '', text, flags=re.I)
    if len(text) < 5 or len(text) > 240:
        return None
    if re.fullmatch(r'[\d\s.,★☆]*\bReviews?', text, re.I):
        return None
    if re.fullmatch(r'(?:view|read|learn|show|see|browse|register|available|all|more|course|courses|details|now|online|sessions|certificate|certification|\W|\d)+', text, re.I):
        return None
    if re.search(r'just a moment|access denied|page not found|404|captcha|enable javascript|sign in|log\s?in|auto draft|instructor version|start your free trial|purchase a new subscription', text, re.I):
        return None
    if re.match(r'^\(Private\)', text, re.I):
        return None
    if re.fullmatch(r'(?:Product Training|Continuing Education Courses(?: - .*)?|Upcoming Events|Key Deadlines|ASHA account|American Speech-Language-Hearing Association|APTA Pick Your Package Pass|2-day Live Workshop|ASHA Online Store.*|Online Courses.*)', text, re.I):
        return None
    if re.search(r'pick your package pass|united states of america|event calendar|\belection\b|meet.?[&a-z ]?greet|awards ceremony|membership meeting|application deadline|volunteer opportunities|listening session|reflection .*deadline|short.term appointee|sold out', text, re.I):
        return None
    return text


def structured_course_links(data, origin_aliases=None):
    """Read Course names/URLs only, never turn provider claims into checked facts.

    Some catalogs emit their parent brand's origin in JSON-LD. Aliases must be
    explicitly registered after checking the rendered links on that catalog.
    The caller still enforces the provider host and course URL pattern.
    """
    found = []
    def walk(node):
        if isinstance(node, list):
            for child in node:
                walk(child)
        elif isinstance(node, dict):
            types = node.get('@type', [])
            types = [types] if isinstance(types, str) else types
            if 'Course' in types and isinstance(node.get('url'), str) and isinstance(node.get('name'), str):
                url = node['url']
                parts = urlsplit(url)
                origin = urlunsplit((*parts[:2], '', '', ''))
                replacement = (origin_aliases or {}).get(origin)
                if replacement:
                    url = replacement.rstrip('/') + urlunsplit(('', '', parts.path, parts.query, parts.fragment))
                found.append((url, node['name']))
            for child in node.values():
                if isinstance(child, (list, dict)):
                    walk(child)
    walk(data)
    return found


def upcoming_session(data):
    """Only structured Event dates establish an upcoming event; never guess from a slug."""
    found = []
    today = datetime.now(timezone.utc).date().isoformat()
    def walk(node):
        if isinstance(node, list):
            for child in node:
                walk(child)
        elif isinstance(node, dict):
            types = node.get('@type', [])
            if isinstance(types, str):
                types = [types]
            if any(t in ('Event', 'EducationEvent', 'CourseInstance') for t in types):
                start, end = str(node.get('startDate', '')), str(node.get('endDate', ''))
                if re.match(r'^\d{4}-\d{2}-\d{2}', start) and (end or start)[:10] >= today and 'Cancelled' not in node.get('eventStatus', ''):
                    found.append({'sessionStart': start, 'sessionEnd': end or start})
            for child in node.values():
                if isinstance(child, (list, dict)):
                    walk(child)
    walk(data)
    return min(found, key=lambda s: s['sessionStart']) if found else {}


def publishable(item):
    if item.get('availability') == 'closed':
        return False
    if not clean_title(item.get('title') or ''):
        return False
    path = urlsplit(item['url']).path
    if re.search(r'archived|auto-draft|/faqs/|instructor-version', path, re.I):
        return False
    dated_course = re.search(r'/courses/(\d{4}-\d{2}-\d{2})/', path)
    if dated_course and dated_course[1] < datetime.now(timezone.utc).date().isoformat():
        # Date-organized catalogs retain old live sessions. An explicitly online
        # or on-demand offering can remain relevant after its original date.
        if not re.search(r'on[ -]?demand|online|self[ -]?paced|recorded', path + ' ' + item['title'], re.I):
            return False
    if re.search(r'/(?:events?|courses-events)/', path):
        # Untimed or expired events stay in the discovery report, not the public course list.
        return bool(item.get('sessionStart')) and str(item.get('sessionEnd') or item['sessionStart'])[:10] >= datetime.now(timezone.utc).date().isoformat()
    return True


def detail_queue(candidates, known, attempts, limit, refresh=False, retry_days=7):
    """Reuse extracted titles and advance past recent failed attempts on bounded runs."""
    now = datetime.now(timezone.utc)
    queue = []
    for entry in candidates.values():
        previous = known.get(entry['url']) or attempts.get(entry['url'], {}).get('entry', {})
        if not refresh and previous and publishable(previous):
            for key in ('title', 'sourceUrl', 'sessionStart', 'sessionEnd', 'discoveredOn'):
                if previous.get(key):
                    entry[key] = previous[key]
        needs_detail = refresh or entry.get('availability') == 'closed' or not entry['title'] or (re.search(r'/(?:events?|courses-events)/', urlsplit(entry['url']).path) and not entry.get('sessionStart'))
        if not needs_detail:
            continue
        attempted = attempts.get(entry['url'], {}).get('attemptedAt')
        if attempted and not refresh:
            try:
                if (now - datetime.fromisoformat(attempted)).total_seconds() < retry_days * 86400:
                    continue
            except ValueError:
                pass
        queue.append(entry)
    return queue[:limit]


class SourceClient:
    def __init__(self, url, max_response_bytes=4_000_000):
        self.origin = urlunsplit((*urlsplit(url)[:2], '', '', ''))
        # Tenant domains (for example teachable.com) are not provider ownership.
        self.domain = urlsplit(url).hostname.removeprefix('www.')
        self.max_response_bytes = max(1, min(12_000_000, max_response_bytes))
        self.robots = RobotFileParser()
        self.last_request = 0
        self.sitemaps = []
        try:
            body, _ = self.request(self.origin + '/robots.txt', robots=False)
            self.robots.parse(body.splitlines())
            self.sitemaps = re.findall(r'^Sitemap:\s*(\S+)', body, re.I | re.M)
        except HTTPError as error:
            if error.code == 404:
                self.robots.parse([])
            else:
                raise

    def allowed_host(self, url):
        host = urlsplit(url).hostname or ''
        return host.removeprefix('www.') == self.domain

    def request(self, url, robots=True, json_body=None, headers=None):
        if not self.allowed_host(url):
            raise ValueError('Off-provider URL requires a registered source')
        if robots and not self.robots.can_fetch(AGENT, url):
            raise PermissionError('Disallowed by robots.txt')
        delay = max(0.5, (self.robots.crawl_delay(AGENT) or 0) if robots else 0)
        time.sleep(max(0, delay - (time.monotonic() - self.last_request)))
        self.last_request = time.monotonic()
        request_headers = {'User-Agent': AGENT, 'Accept': 'text/html,application/xml,text/xml', **(headers or {})}
        data = None
        if json_body is not None:
            data = json.dumps(json_body).encode()
            request_headers.update({'Content-Type': 'application/json', 'Accept': 'application/json'})
        req = Request(url, data=data, headers=request_headers)
        with urlopen(req, timeout=15, context=TLS) as response:
            if not self.allowed_host(response.url):
                raise ValueError('Redirected off-provider; update source registry')
            raw = response.read(self.max_response_bytes + 1)
            if len(raw) > self.max_response_bytes:
                raise ValueError(f'Source exceeds {self.max_response_bytes} byte response limit')
            return raw.decode(response.headers.get_content_charset() or 'utf-8', errors='replace'), response.url


CONTINUED_SEARCH_QUERY = '''query CatalogCourses($input: SearchCoursesInput, $page: Int!, $first: Int!) {
  searchCourses(input: $input, page: $page, first: $first) {
    data { title slug durationHours durationMinutes instructionalLevel courseFormats(filter: {isPublished: true}) { type } }
    paginatorInfo { currentPage hasMorePages total }
  }
}'''


def provider_reported_facts(row, source_url):
    hours, minutes = row.get('durationHours'), row.get('durationMinutes')
    duration = None
    if all(v is None or (type(v) in (int, float) and v >= 0) for v in (hours, minutes)) and (hours is not None or minutes is not None):
        total = (hours or 0) * 60 + (minutes or 0)
        if 0 < total <= 60000 and (minutes or 0) < 60:
            duration = total
    raw_level = str(row.get('instructionalLevel', '')).lower().replace('_level', '').strip()
    level = raw_level if raw_level in ('introductory', 'intermediate', 'advanced') else None
    formats = sorted(set({'VIDEO_RECORDED': 'online', 'TEXT_ORIGINAL': 'online', 'TEXT_TRANSCRIPT': 'online', 'AUDIO': 'online', 'AUDIO_PODCAST': 'online', 'LIVE': 'liveOnline'}[x['type']] for x in row.get('courseFormats', []) if isinstance(x, dict) and x.get('type') in ('VIDEO_RECORDED', 'TEXT_ORIGINAL', 'TEXT_TRANSCRIPT', 'AUDIO', 'AUDIO_PODCAST', 'LIVE')))
    return {'durationMinutes': duration, 'level': level, 'formats': formats, 'sourceUrl': source_url, 'checkedOn': datetime.now(timezone.utc).date().isoformat()}


def continued_catalog_pages(provider, max_pages, facts=None):
    """Read the same unauthenticated search used by the public OT catalog.

    Only this fixed read-only query is supported. No account, cookie, API key,
    enrollment, review, or CE-approval fields are requested or retained.
    """
    api = provider['publicCatalogApi']
    if api.get('kind') != 'continued-search' or api.get('url') != 'https://athena-api-prod.continued.com/':
        raise ValueError('Unrecognized public catalog API')
    if not re.fullmatch(r'[a-z]+(?:-[a-z]+)*', api.get('learningSpacePath', '')):
        raise ValueError('Invalid public learning-space path')
    client = SourceClient(api['url'])
    seen = set()
    for number in range(1, max(1, min(200, max_pages)) + 1):
        body, _ = client.request(api['url'], json_body={
            'query': CONTINUED_SEARCH_QUERY,
            'variables': {'page': number, 'first': 20, 'input': {
                'hideCompletedCourses': False,
                'courseFormats': ['VIDEO_RECORDED', 'TEXT_ORIGINAL', 'TEXT_TRANSCRIPT', 'LIVE', 'AUDIO', 'AUDIO_PODCAST'],
            }},
        }, headers={'X-Learning-Space-Path': api['learningSpacePath']})
        payload = json.loads(body)
        if not isinstance(payload, dict) or payload.get('errors'):
            raise ValueError('Public catalog API returned GraphQL errors')
        data = payload.get('data')
        result = data.get('searchCourses') if isinstance(data, dict) else None
        if not isinstance(result, dict) or not isinstance(result.get('data'), list):
            raise ValueError('Public catalog API response shape changed')
        page_info = result.get('paginatorInfo', {})
        if not isinstance(page_info, dict) or page_info.get('currentPage') != number or not isinstance(page_info.get('hasMorePages'), bool):
            raise ValueError('Public catalog API pagination is invalid')
        rows = result['data']
        signature = tuple(str(row.get('slug', '')) for row in rows if isinstance(row, dict))
        if signature in seen or (not rows and page_info['hasMorePages']):
            raise ValueError('Public catalog API repeated or returned an empty page before completion')
        seen.add(signature)
        links = []
        for row in rows:
            if not isinstance(row, dict) or not isinstance(row.get('courseFormats'), list) or not row['courseFormats']:
                continue
            slug, title = row.get('slug'), row.get('title')
            if not isinstance(slug, str) or not re.fullmatch(r'[a-zA-Z0-9_-]+', slug) or not isinstance(title, str):
                continue
            course_url = urljoin(provider['catalogUrl'], '/courses/' + slug)
            links.append((course_url, title))
            if facts is not None:
                facts[canonical_url(course_url)] = provider_reported_facts(row, course_url)
        yield number, links, page_info['hasMorePages']
        if not page_info['hasMorePages']:
            break


def discover(provider, details, max_sitemaps, refresh_titles=False, known=None, attempts=None, retry_days=7, max_catalog_pages=1):
    now = datetime.now(timezone.utc).isoformat(timespec='seconds')
    pid = provider['id']
    coverage = {'providerId': pid, 'attemptedAt': now, 'status': 'pending', 'errors': [], 'sources': []}
    candidates = {}
    pattern = re.compile(provider['courseUrlPattern'])
    attempts = attempts if attempts is not None else {}

    def add(url, title, source):
        url = canonical_url(url)
        if not url or not client.allowed_host(url) or not pattern.search(urlsplit(url).path + ('?' + urlsplit(url).query if urlsplit(url).query else '')):
            return
        if re.search(r'\.(?:pdf|jpg|png|zip|xml|mp4)$', urlsplit(url).path, re.I):
            return
        if provider.get('excludeUrlPattern') and re.search(provider['excludeUrlPattern'], url, re.I):
            return
        if provider.get('catalogLinkPattern') and not re.search(provider['catalogLinkPattern'], title, re.I):
            return
        entry = candidates.setdefault(url, {'providerId': pid, 'url': url, 'title': None, 'sourceUrl': source})
        title = clean_title(title)
        if title and (not entry['title'] or len(title) > len(entry['title'])):
            entry.update(title=title, sourceUrl=source)

    try:
        client = SourceClient(provider['catalogUrl'], provider.get('maxResponseBytes', 4_000_000))
    except (HTTPError, URLError, TimeoutError, ValueError, OSError) as error:
        coverage.update(status='blocked', errors=[str(error)], discoveredCount=0, listedCount=0)
        return coverage, [], [], []

    catalog_queue = [provider['catalogUrl'], *provider.get('additionalCatalogUrls', [])]
    catalog_seen = set()
    # Explicit seeds always run. Pagination is opt-in, same-provider, and bounded.
    catalog_limit = len(catalog_queue) + max(0, min(200, max_catalog_pages) - 1)
    while catalog_queue and len(catalog_seen) < catalog_limit:
        seed = canonical_url(catalog_queue.pop(0))
        if not seed or seed in catalog_seen:
            continue
        catalog_seen.add(seed)
        try:
            body, final_url = client.request(seed)
            page = PageParser()
            page.feed(body)
            coverage['sources'].append(final_url)
            # A seed can itself be a single course.
            add(final_url, ' '.join(page.h1), final_url)
            for href, title in page.links:
                add(urljoin(final_url, href), title, final_url)
                next_url = canonical_url(urljoin(final_url, href))
                pagination_pattern = provider.get('catalogPaginationPattern')
                if (pagination_pattern and re.match(r'^Next\b', title.strip(), re.I)
                        and next_url and client.allowed_host(next_url)
                        and re.fullmatch(pagination_pattern, urlsplit(next_url).path)):
                    catalog_queue.append(next_url)
            for href, title in structured_course_links(page.json_ld, provider.get('structuredUrlOriginAliases')):
                add(urljoin(final_url, href), title, final_url)
        except (HTTPError, URLError, TimeoutError, ValueError, OSError) as error:
            coverage['errors'].append(f'{seed}: {error}')

    if provider.get('publicCatalogApi'):
        coverage.update(apiPagesFetched=0, apiPaginationPending=True)
        reported_facts = {}
        try:
            for number, links, more in continued_catalog_pages(provider, max_catalog_pages, reported_facts):
                for url, title in links:
                    add(url, title, provider['catalogUrl'])
                    key = canonical_url(url)
                    if key in candidates and key in reported_facts:
                        candidates[key]['providerFacts'] = reported_facts[key]
                coverage.update(apiPagesFetched=number, apiPaginationPending=more)
            coverage['sources'].append(provider['publicCatalogApi']['url'])
        except (HTTPError, URLError, TimeoutError, ValueError, OSError) as error:
            coverage['errors'].append(f"Public catalog API: {error}")

    queue = (client.sitemaps or [client.origin + '/sitemap.xml', client.origin + '/sitemap_index.xml']) if provider.get('sitemapDiscovery', True) else []
    seen = set()
    while queue and len(seen) < max_sitemaps:
        url = queue.pop(0)
        if url in seen:
            continue
        seen.add(url)
        try:
            body, _ = client.request(url)
            tree = ET.fromstring(body)
            locs = [node.text.strip() for node in tree.iter() if node.tag.split('}')[-1] == 'loc' and node.text]
            if tree.tag.split('}')[-1] == 'sitemapindex':
                # Prefer course/product sitemaps over posts, authors, or media.
                locs.sort(key=lambda x: (not bool(re.search('course|product|event', x, re.I)), x))
                queue.extend(locs)
            else:
                for loc in locs:
                    add(loc, '', url)
            coverage['sources'].append(url)
        except (HTTPError, URLError, TimeoutError, ValueError, OSError, ET.ParseError) as error:
            coverage['errors'].append(f'{url}: {error}')

    for url, entry in candidates.items():
        if (known or {}).get(url, {}).get('availability') == 'closed':
            entry.update(known[url])
    selected = detail_queue(candidates, known or {}, attempts, details, refresh_titles, retry_days)
    for entry in selected:
        try:
            body, final_url = client.request(entry['url'])
            page = PageParser()
            page.feed(body)
            heading_title = clean_title(' '.join(page.h1))
            document_title = clean_title(' '.join(page.title).split(' | ')[0])
            title = (document_title or heading_title) if provider.get('detailTitleSource') == 'document' else (heading_title or document_title)
            if title:
                entry.update(title=title, sourceUrl=final_url)
            closed = bool(re.search(r'(?:this course is|course currently|enrollment is) closed for (?:enrollment|enrolment|registration)|this course is no longer available', ' '.join(page.page_text), re.I))
            if not title and not closed:
                raise ValueError('No course title extracted; prior availability retained')
            entry.update(availability='closed' if closed else 'unknown', availabilityCheckedOn=now[:10])
            if closed:
                entry.update(availabilityEvidence='Provider page states enrollment is closed.', sourceUrl=final_url)
            else:
                entry.pop('availabilityEvidence', None)
            entry.update(upcoming_session(page.json_ld))
        except (HTTPError, URLError, TimeoutError, ValueError, OSError) as error:
            coverage['errors'].append(f"{entry['url']}: {error}")
        attempts[entry['url']] = {'attemptedAt': now, 'entry': dict(entry)}

    listings, pending, unavailable = [], [], []
    for entry in candidates.values():
        if entry.get('availability') == 'closed':
            unavailable.append(entry)
        elif publishable(entry):
            listings.append({**entry, 'id': pid + '-' + hashlib.sha256(entry['url'].encode()).hexdigest()[:12],
                             'reviewStatus': 'discovered', 'availability': 'unknown', 'discoveredOn': entry.get('discoveredOn', now[:10])})
        else:
            pending.append({'providerId': pid, 'url': entry['url'], 'sourceUrl': entry['sourceUrl']})
    coverage.update(status=('discovered' if listings else 'needs-review') if coverage['sources'] else 'blocked',
                    discoveredCount=len(candidates), listedCount=len(listings), catalogPagesFetched=len(catalog_seen),
                    catalogPaginationPending=bool(catalog_queue), detailPagesFetched=len(selected), pendingCount=len(pending), unavailableCount=len(unavailable))
    return coverage, listings, pending, unavailable


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--provider', action='append', help='Provider id; repeat to select several')
    parser.add_argument('--details', type=int, default=20, help='Maximum untitled detail pages per provider')
    parser.add_argument('--sitemaps', type=int, default=5)
    parser.add_argument('--catalog-pages', type=int, default=1, help='Maximum catalog pages per provider, including opt-in Next links (up to 200); explicit seeds always run')
    parser.add_argument('--workers', type=int, default=6)
    parser.add_argument('--publish', action='store_true')
    parser.add_argument('--refresh-titles', action='store_true', help='Read detail pages even when a catalog anchor supplies a title')
    parser.add_argument('--retry-after-days', type=int, default=7, help='Retry unsuccessful detail extraction after this many days; 0 retries immediately')
    args = parser.parse_args()
    registry = json.loads((DATA / 'providers.json').read_text())
    providers = [p for p in registry['providers'] if not args.provider or p['id'] in args.provider]
    if not providers or (args.provider and set(args.provider) - {p['id'] for p in providers}):
        parser.error('Unknown provider id')
    coverage, listings, pending, unavailable = [], [], [], []
    artifact = ROOT / 'artifacts/catalog'
    artifact.mkdir(parents=True, exist_ok=True)
    lock_handle = (artifact / '.import.lock').open('a')
    try:
        fcntl.flock(lock_handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        parser.error('Another catalog import is running. Wait for it to finish before starting another.')
    state_path = artifact / 'crawl-state.json'
    state = json.loads(state_path.read_text()) if state_path.exists() else {}
    old_items = json.loads((DATA / 'discoveredCourses.json').read_text()) if (DATA / 'discoveredCourses.json').exists() else []
    unavailable_path = DATA / 'unavailableCourses.json'
    old_unavailable = json.loads(unavailable_path.read_text()) if unavailable_path.exists() else []
    known = {p['id']: {canonical_url(x['url']): x for x in old_items + old_unavailable if x['providerId'] == p['id']} for p in providers}
    with ThreadPoolExecutor(max_workers=max(1, min(8, args.workers))) as pool:
        futures = {pool.submit(discover, p, max(0, args.details), max(0, args.sitemaps), args.refresh_titles, known[p['id']], state.setdefault(p['id'], {}), max(0, args.retry_after_days), args.catalog_pages): p for p in providers}
        for future in as_completed(futures):
            c, items, missing, closed = future.result()
            coverage.append(c)
            listings.extend(items)
            pending.extend(missing)
            unavailable.extend(closed)
            print(f"{c['providerId']}: {c['status']}; {c['listedCount']} titled listings / {c['discoveredCount']} URLs", flush=True)
    report = {'runAt': datetime.now(timezone.utc).isoformat(timespec='seconds'), 'coverage': coverage, 'listings': listings, 'pendingUrls': pending, 'unavailable': unavailable}
    (artifact / 'discovery.json').write_text(json.dumps(report, indent=2) + '\n')
    (artifact / ('discovery-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%f') + '.json')).write_text(json.dumps(report, indent=2) + '\n')
    state_path.write_text(json.dumps(state, indent=2) + '\n')
    if args.publish:
        ids = {p['id'] for p in providers}
        old_items = json.loads((DATA / 'discoveredCourses.json').read_text()) if (DATA / 'discoveredCourses.json').exists() else []
        old_coverage = json.loads((DATA / 'coverage.json').read_text()) if (DATA / 'coverage.json').exists() else []
        # A failed refresh must not silently remove earlier findings.
        # Reapply tightened source rules to earlier findings. Preserve valid
        # records on failed refreshes, but remove navigation / block-page artifacts.
        by_provider = {p['id']: p for p in registry['providers']}
        closed = {(x['providerId'], canonical_url(x['url'])): x for x in old_unavailable + unavailable}
        for item in listings:
            if item.get('availabilityCheckedOn'):
                closed.pop((item['providerId'], canonical_url(item['url'])), None)
        merged = {}
        for item in old_items + listings:
            p = by_provider.get(item['providerId'])
            title = clean_title(item['title'])
            url = canonical_url(item['url'])
            if not p or not title or not url or not publishable(item):
                continue
            if (item['providerId'], url) in closed:
                continue
            parts = urlsplit(url)
            if not re.search(p['courseUrlPattern'], parts.path + ('?' + parts.query if parts.query else '')):
                continue
            if p.get('excludeUrlPattern') and re.search(p['excludeUrlPattern'], url, re.I):
                continue
            item = {**item, 'title': title, 'url': url, 'id': p['id'] + '-' + hashlib.sha256(url.encode()).hexdigest()[:12]}
            merged[(p['id'], url)] = item
        (DATA / 'discoveredCourses.json').write_text(json.dumps(sorted(merged.values(), key=lambda x: (x['providerId'], x['title'])), indent=2) + '\n')
        unavailable_path.write_text(json.dumps(sorted(closed.values(), key=lambda x: (x['providerId'], x['url'])), indent=2) + '\n')
        (DATA / 'coverage.json').write_text(json.dumps(sorted([c for c in old_coverage if c['providerId'] not in ids] + coverage, key=lambda x: x['providerId']), indent=2) + '\n')
    print(f"Saved {len(listings)} listings; {len(pending)} URLs await title extraction. No courses were scored or approved for CE.")


if __name__ == '__main__':
    main()
