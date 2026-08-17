#!/usr/bin/env python3
"""Attach the screen recording and resubmit version 1.0. Added 2026-08-17.
Usage:
  python3 scripts/asc_submit.py attach /path/to/recording.mp4     (uploads an App Review attachment)
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
    open_subs = [s for s in subs if s['attributes']['state'] in ('UNRESOLVED_ISSUES', 'READY_FOR_REVIEW')]
    if not open_subs: print('no open submission to resubmit'); sys.exit(1)
    sid = open_subs[0]['id']
    st, res = asc.call('PATCH', f'/v1/reviewSubmissions/{sid}', {'data': {'type': 'reviewSubmissions', 'id': sid, 'attributes': {'submitted': True}}})
    print('resubmit:', st, res['data']['attributes'] if st == 200 else json.dumps(res)[:1200])

cmd = sys.argv[1] if len(sys.argv) > 1 else 'status'
{'attach': lambda: attach(sys.argv[2]), 'status': status, 'submit': submit}[cmd]()
