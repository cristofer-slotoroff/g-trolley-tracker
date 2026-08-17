#!/usr/bin/env python3
"""Attach the screen recording and resubmit version 1.0. Added 2026-08-17.
Usage:
  python3 scripts/asc_submit.py attach [/path/to/recording.mp4]   (uploads an App Review attachment; default ~/Downloads/philly-trolleys-review.mp4)
  python3 scripts/asc_submit.py status                            (attachments and submission state)
  python3 scripts/asc_submit.py submit                            (resubmits the review submission)"""
import sys, os, json, hashlib, subprocess
sys.path.insert(0, os.path.dirname(__file__))
import asc
APP = '6802036569'

def version_and_detail():
    st, v = asc.call('GET', f'/v1/apps/{APP}/appStoreVersions?fields[appStoreVersions]=versionString,appVersionState&limit=1')
    vid = v['data'][0]['id']
    st, rd = asc.call('GET', f'/v1/appStoreVersions/{vid}/appStoreReviewDetail')
    return vid, v['data'][0]['attributes'], rd['data']['id']

def attach(path):
    vid, attrs, rid = version_and_detail()
    size = os.path.getsize(path); name = os.path.basename(path)
    print(f'uploading {name} ({size/1e6:.1f} MB) to version {attrs["versionString"]} ({attrs["appVersionState"]})')
    st, res = asc.call('POST', '/v1/appStoreReviewAttachments', {'data': {'type': 'appStoreReviewAttachments',
        'attributes': {'fileName': name, 'fileSize': size},
        'relationships': {'appStoreReviewDetail': {'data': {'type': 'appStoreReviewDetails', 'id': rid}}}}})
    if st != 201: print('reserve FAILED', st, json.dumps(res)[:800]); sys.exit(1)
    aid = res['data']['id']; ops = res['data']['attributes']['uploadOperations']
    with open(path, 'rb') as f: data = f.read()
    for i, op in enumerate(ops):
        chunk = data[op['offset']:op['offset'] + op['length']]
        cmd = ['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', '-X', op['method'], op['url'], '--data-binary', '@-']
        for h in op.get('requestHeaders', []): cmd += ['-H', f"{h['name']}: {h['value']}"]
        code = subprocess.run(cmd, input=chunk, capture_output=True).stdout.decode()
        print(f'  part {i+1}/{len(ops)}: HTTP {code}')
        if not code.startswith('2'): print('chunk upload FAILED'); sys.exit(1)
    md5 = hashlib.md5(data).hexdigest()
    st, res = asc.call('PATCH', f'/v1/appStoreReviewAttachments/{aid}', {'data': {'type': 'appStoreReviewAttachments', 'id': aid,
        'attributes': {'uploaded': True, 'sourceFileChecksum': md5}}})
    print('commit:', st, res['data']['attributes'].get('assetDeliveryState') if st == 200 else res)

def status():
    vid, attrs, rid = version_and_detail()
    print('version', attrs)
    st, a = asc.call('GET', f'/v1/appStoreReviewDetails/{rid}/appStoreReviewAttachments?fields[appStoreReviewAttachments]=fileName,fileSize,assetDeliveryState')
    for x in a.get('data', []): print(' attachment', x['attributes']['fileName'], x['attributes'].get('assetDeliveryState', {}).get('state'))
    st, b = asc.call('GET', f'/v1/appStoreVersions/{vid}/build?fields[builds]=version')
    print(' build', b['data']['attributes']['version'] if b.get('data') else None)
    st, r = asc.call('GET', f'/v1/reviewSubmissions?filter[app]={APP}&fields[reviewSubmissions]=state,submittedDate&limit=3')
    for s in r['data']: print(' submission', s['id'], s['attributes'])
    return r['data']

def submit():
    subs = status()
    vid, attrs, rid = version_and_detail()
    st, a = asc.call('GET', f'/v1/appStoreReviewDetails/{rid}/appStoreReviewAttachments?fields[appStoreReviewAttachments]=fileName,assetDeliveryState')
    done = [x for x in a.get('data', []) if x['attributes'].get('assetDeliveryState', {}).get('state') == 'COMPLETE']
    if not done:
        print('STOP: no completed screen-recording attachment on the review detail. Run: asc_submit.py attach <file>'); sys.exit(1)
    open_subs = [s for s in subs if s['attributes']['state'] in ('UNRESOLVED_ISSUES', 'READY_FOR_REVIEW')]
    if open_subs:
        sid = open_subs[0]['id']
    else:
        st, res = asc.call('POST', '/v1/reviewSubmissions', {'data': {'type': 'reviewSubmissions', 'attributes': {'platform': 'IOS'},
            'relationships': {'app': {'data': {'type': 'apps', 'id': APP}}}}})
        if st != 201: print('new submission failed', st, json.dumps(res, indent=1)); sys.exit(1)
        sid = res['data']['id']; print('new submission', sid[:8])
    st, items = asc.call('GET', f'/v1/reviewSubmissions/{sid}/items?include=appStoreVersion')
    has_version = any(x['type'] == 'appStoreVersions' and x['id'] == vid for x in items.get('included', []))
    if not has_version:
        st, res = asc.call('POST', '/v1/reviewSubmissionItems', {'data': {'type': 'reviewSubmissionItems',
            'relationships': {'reviewSubmission': {'data': {'type': 'reviewSubmissions', 'id': sid}},
                              'appStoreVersion': {'data': {'type': 'appStoreVersions', 'id': vid}}}}})
        if st != 201:
            print('add version 1.0 to submission FAILED', st); print(json.dumps(res, indent=1)); sys.exit(1)
        print('version 1.0 added to submission', sid[:8])
    st, res = asc.call('PATCH', f'/v1/reviewSubmissions/{sid}', {'data': {'type': 'reviewSubmissions', 'id': sid, 'attributes': {'submitted': True}}})
    if st == 200: print('SUBMITTED. state:', res['data']['attributes']['state'])
    else: print('submit FAILED', st); print(json.dumps(res, indent=1))

DEFAULT_VIDEO = os.path.expanduser('~/Downloads/philly-trolleys-review.mp4')  # 2026-08-17: 2.5 Mbps re-encode of the phone recording (40 MB)
{'attach': lambda: attach(sys.argv[2] if len(sys.argv) > 2 else DEFAULT_VIDEO), 'status': status, 'submit': submit}[cmd]()
