The SEPTA Metro "G" Line, formerly Route 15, is a trolley/bus line making stops (mostly) along Girard Avenue. 

Sometimes riders get a normal SEPTA bus, but other times, they get a glorious vintage PCC trolley car!

This app tracks the PCC trolleys only so that you can easily make a plan to ride one. 

Simply select your origin SEPTA metro or regional rail stop and have fun, fellow trolley rider!

## Deploying (read this before you deploy)

**Deploy by pushing to `main`.** The Netlify site (`septa-g-trolley-tracker`, ID
`07efeb5a-8dce-4252-adca-30b4c097f865`) is connected to this repo and builds on
every push, which runs `npm install` and bundles the functions correctly.

**Do not run `netlify deploy --prod --dir .`.** `netlify.toml` marks
`@supabase/supabase-js` as an external module, so the CLI expects it in
`node_modules` and ships the functions without it when that folder is missing.
The functions then return HTTP 502 `Cannot find module '@supabase/supabase-js'`.

Broke exactly this way on 2026-08-19, 6:37 PM to 9:14 PM ET: a CLI deploy landed
on top of a good git build and took down push-subscription, push-stop-alert,
push-status, pcc-stats, and log-visit. The app showed "Could not reach the
server to save your alert setting" the day it went on sale.

**If you must deploy from the CLI**, run `npm install` first, then verify:

```sh
for f in pcc-stats push-status log-visit widget-status; do
  curl -s -o /dev/null -w "$f %{http_code}\n" \
    "https://septa-g-trolley-tracker.netlify.app/.netlify/functions/$f"
done
```

All four must return 200. `push-subscription` and `push-stop-alert` return 405
on GET, which is correct; they accept POST only.
