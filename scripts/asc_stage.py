#!/usr/bin/env python3
"""Stage version 1.0 for resubmission: write the App Review notes and attach a build. Added 2026-08-17.
Usage: python3 scripts/asc_stage.py [build number]     (default: the newest VALID build)
Nothing here submits anything."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
import asc
APP = '6802036569'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

st, v = asc.call('GET', f'/v1/apps/{APP}/appStoreVersions?fields[appStoreVersions]=versionString,appVersionState&limit=1')
ver = v['data'][0]; vid = ver['id']
print('version', ver['attributes']['versionString'], ver['attributes']['appVersionState'])

# 1. Notes
notes = open(os.path.join(ROOT, 'docs/app-review-notes.txt')).read().strip()
assert len(notes) <= 4000, f'notes are {len(notes)} chars, limit 4000'
st, rd = asc.call('GET', f'/v1/appStoreVersions/{vid}/appStoreReviewDetail')
rid = rd['data']['id']
st, res = asc.call('PATCH', f'/v1/appStoreReviewDetails/{rid}', {'data': {'type': 'appStoreReviewDetails', 'id': rid, 'attributes': {'notes': notes}}})
print('notes:', 'written' if st == 200 else f'FAILED {st} {res}')
st, rd = asc.call('GET', f'/v1/appStoreReviewDetails/{rid}?fields[appStoreReviewDetails]=notes')
print('notes read back:', len(rd['data']['attributes']['notes']), 'chars, starts:', rd['data']['attributes']['notes'][:50])

# 2. Build
st, b = asc.call('GET', f'/v1/builds?filter[app]={APP}&sort=-uploadedDate&fields[builds]=version,processingState&limit=10')
want = sys.argv[1] if len(sys.argv) > 1 else None
builds = [x for x in b['data'] if x['attributes']['processingState'] == 'VALID' and (want is None or x['attributes']['version'] == want)]
if not builds:
    print('no VALID build found', 'for', want, '(still processing?)'); sys.exit(1)
bld = builds[0]
st, res = asc.call('PATCH', f'/v1/appStoreVersions/{vid}/relationships/build', {'data': {'type': 'builds', 'id': bld['id']}})
print('attach build', bld['attributes']['version'] + ':', 'done' if st == 204 else f'FAILED {st} {res}')
st, cur = asc.call('GET', f'/v1/appStoreVersions/{vid}/build?fields[builds]=version')
print('version now carries build', cur['data']['attributes']['version'])
