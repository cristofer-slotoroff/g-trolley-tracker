#!/usr/bin/env python3
"""Tiny App Store Connect API client (no dependencies beyond openssl and curl). Added 2026-08-17.
Reads the key from ~/.appstoreconnect/private_keys/AuthKey_PWRCG89KNQ.p8 and the Issuer ID from ~/.appstoreconnect/issuer_id.
Usage: python3 scripts/asc.py GET /v1/apps/6802036569   |   python3 scripts/asc.py PATCH /v1/x '{json}'
Also imported by asc_stage.py and asc_submit.py."""
import sys, json, time, base64, subprocess, urllib.request, urllib.error, os
KEY_ID='PWRCG89KNQ'; ISSUER=open(os.path.expanduser('~/.appstoreconnect/issuer_id')).read().strip()
KEY_PATH=os.path.expanduser(f'~/.appstoreconnect/private_keys/AuthKey_{KEY_ID}.p8')
def b64(b): return base64.urlsafe_b64encode(b).rstrip(b'=').decode()
def token():
    hdr=b64(json.dumps({'alg':'ES256','kid':KEY_ID,'typ':'JWT'}).encode())
    now=int(time.time())
    pl=b64(json.dumps({'iss':ISSUER,'iat':now,'exp':now+1200,'aud':'appstoreconnect-v1'}).encode())
    msg=f'{hdr}.{pl}'.encode()
    der=subprocess.run(['openssl','dgst','-sha256','-sign',KEY_PATH],input=msg,capture_output=True,check=True).stdout
    # DER ECDSA sig -> raw r||s
    assert der[0]==0x30; i=2
    assert der[i]==0x02; rl=der[i+1]; r=der[i+2:i+2+rl]; i=i+2+rl
    assert der[i]==0x02; sl=der[i+1]; s=der[i+2:i+2+sl]
    r=r.lstrip(b'\x00').rjust(32,b'\x00'); s=s.lstrip(b'\x00').rjust(32,b'\x00')
    return f'{hdr}.{pl}.{b64(r+s)}'
def call(method,path,body=None):
    url='https://api.appstoreconnect.apple.com'+path if path.startswith('/') else path
    cmd=['curl','-s','-g','--max-time','60','-w','\n%{http_code}','-X',method,'-H','Authorization: Bearer '+token(),'-H','Content-Type: application/json',url]
    if body is not None: cmd+=['--data',json.dumps(body)]
    out=subprocess.run(cmd,capture_output=True,text=True).stdout
    body_txt,_,code=out.rpartition('\n')
    try: data=json.loads(body_txt) if body_txt.strip() else None
    except Exception: data=body_txt
    return int(code or 0), data
if __name__=='__main__':
    m=sys.argv[1]; p=sys.argv[2]; b=json.loads(sys.argv[3]) if len(sys.argv)>3 else None
    st,res=call(m,p,b); print(st); print(json.dumps(res,indent=1)[:6000])
