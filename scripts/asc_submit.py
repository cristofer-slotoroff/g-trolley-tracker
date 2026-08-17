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
    vid, attrs, rid = version_and_detail()
    st, a = asc.call('GET', f'/v1/appStoreReviewDetails/{rid}/appStoreReviewAttachments?fields[appStoreReviewAttachments]=fileName,assetDeliveryState')
    done = [x for x in a.get('data', []) if x['attributes'].get('assetDeliveryState', {}).get('state') == 'COMPLETE']
    if not done:
        print('STOP: no completed screen-recording attachment on the review detail. Run: asc_submit.py attach <file>'); sys.exit(1)
    open_subs = [s for s in subs if s['attributes']['state'] in ('UNRESOLVED_ISSUES', 'READY_FOR_REVIEW')]

    def try_submit(sid):
        st, res = asc.call('PATCH', f'/v1/reviewSubmissions/{sid}', {'data': {'type': 'reviewSubmissions', 'id': sid, 'attributes': {'submitted': True}}})
        ok = st == 200
        print('resubmit', sid[:8] + ':', 'SUBMITTED, state ' + res['data']['attributes']['state'] if ok else f'not accepted ({st}) ' + json.dumps(res)[:400])
        return ok

    def add_item(sid):
        st, res = asc.call('POST', '/v1/reviewSubmissionItems', {'data': {'type': 'reviewSubmissionItems',
            'relationships': {'reviewSubmission': {'data': {'type': 'reviewSubmissions', 'id': sid}},
                              'appStoreVersion': {'data': {'type': 'appStoreVersions', 'id': vid}}}}})
        print('add version 1.0 to submission:', 'ok' if st == 201 else f'failed ({st}) ' + json.dumps(res)[:400])
        return st == 201

    if open_subs:
        sid = open_subs[0]['id']
        if try_submit(sid): return
        # Fallback 1: refresh the item (drop the rejected one, add the version again), then submit.
        st, items = asc.call('GET', f'/v1/reviewSubmissions/{sid}/items')
        for it in items.get('data', []):
            st, res = asc.call('DELETE', f'/v1/reviewSubmissionItems/{it["id"]}')
            print('remove old item:', st)
        if add_item(sid) and try_submit(sid): return
        # Fallback 2: cancel this submission and open a fresh one.
        st, res = asc.call('PATCH', f'/v1/reviewSubmissions/{sid}', {'data': {'type': 'reviewSubmissions', 'id': sid, 'attributes': {'canceled': True}}})
        print('cancel old submission:', st)
    st, res = asc.call('POST', '/v1/reviewSubmissions', {'data': {'type': 'reviewSubmissions', 'attributes': {'platform': 'IOS'},
        'relationships': {'app': {'data': {'type': 'apps', 'id': APP}}}}})
    if st != 201: print('new submission failed', st, json.dumps(res)[:600]); sys.exit(1)
    sid = res['data']['id']; print('new submission', sid[:8])
    if add_item(sid): try_submit(sid)

cmd = sys.argv[1] if len(sys.argv) > 1 else 'status'
{'attach': lambda: attach(sys.argv[2]), 'status': status, 'submit': submit}[cmd]()
