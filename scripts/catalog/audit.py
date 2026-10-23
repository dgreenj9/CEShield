#!/usr/bin/env python3
"""Read-only rotating course and credential link audit; HTTP blocks are not closures."""
import argparse
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import json
from urllib.error import HTTPError
from urllib.parse import urlsplit
from discover import ROOT, DATA, SourceClient

def audit_group(entries):
    rows=[]
    try:
        client=SourceClient(entries[0]['url'])
    except Exception as error:
        return [{**entry,'status':'unreachable','detail':str(error)} for entry in entries]
    for entry in entries:
        try:
            _, final=client.request(entry['url'])
            rows.append({**entry,'status':'reachable','finalUrl':final})
        except HTTPError as error:
            rows.append({**entry,'status':'missing' if error.code in (404,410) else 'restricted','httpStatus':error.code})
        except Exception as error:
            rows.append({**entry,'status':'unreachable','detail':str(error)})
    return rows

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--limit',type=int,default=250)
    args=parser.parse_args()
    courses=json.loads((DATA/'discoveredCourses.json').read_text())+json.loads((DATA/'courses.json').read_text())
    urls=sorted({x['url'] for x in courses},key=lambda u:hashlib.sha256(u.encode()).hexdigest())
    limit=max(1,min(1000,args.limit))
    week=int(datetime.now(timezone.utc).timestamp()//(7*86400))
    offset=(week % max(1,(len(urls)+limit-1)//limit))*limit
    entries=[{'url':u,'kind':'course'} for u in urls[offset:offset+limit]]
    credentials=json.loads((DATA/'credentialLinks.json').read_text())
    entries += [{'url':u,'kind':'credential'} for u in sorted({link['url'] for x in credentials.values() for link in x['links']})]
    groups=defaultdict(list)
    for entry in entries:groups[urlsplit(entry['url']).hostname].append(entry)
    with ThreadPoolExecutor(max_workers=6) as pool:
        rows=[row for group in pool.map(audit_group,groups.values()) for row in group]
    report={'checkedAt':datetime.now(timezone.utc).isoformat(),'totalCourseUrls':len(urls),'courseSampleOffset':offset,'courseSampleSize':len(urls[offset:offset+limit]),'rows':rows}
    dest=ROOT/'artifacts/catalog/link-audit.json';dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({'checked':len(rows),'missing':sum(x['status']=='missing' for x in rows),'restrictedOrUnreachable':sum(x['status'] in ('restricted','unreachable') for x in rows)}))
if __name__=='__main__':main()
