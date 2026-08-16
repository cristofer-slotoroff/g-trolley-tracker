#!/usr/bin/env python3
"""Regenerates netlify/lib/g-stops.js from the stop arrays in app.js. Run from the repo root."""
import re
s=open('app.js',encoding='utf-8').read()
a=s.index('const G_LINE_STOPS_FULL = ['); b=s.index('];', a)+2
c=s.index('const G_LINE_STOPS_SIMPLE = ['); d=s.index('];', c)+2
t=open('netlify/lib/g-stops.js').read()
ta=t.index('export const G_LINE_STOPS_FULL'); tb=t.index('];', ta)+2
t=t[:ta]+'export '+s[a:b]+t[tb:]
tc=t.index('export const G_LINE_STOPS_SIMPLE'); td=t.index('];', tc)+2
t=t[:tc]+'export '+s[c:d]+t[td:]
open('netlify/lib/g-stops.js','w').write(t)
print('g-stops.js synced')
