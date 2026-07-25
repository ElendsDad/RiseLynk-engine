# CI (suites)

GitHub Actions runs `.github/workflows/suites.yml` on every push to a `claude/**` branch and on every pull request targeting `main`.

## What runs

The job `suites` installs with `npm ci`, then enumerates every `test:*` script from `package.json` and runs them in sorted order. A new gate lands in CI automatically when its `test:*` entry is added to `package.json`.

No TypeScript `tsc --noEmit` step: the repo's release gates are the `test:*` battery (see `CLAUDE.md`), not a separate typecheck script.

## What green means

All `test:*` suites passed. Locally, prove the same with:

```bash
npm ci
node -e "const {spawnSync}=require('child_process');const s=Object.keys(require('./package.json').scripts).filter(k=>k.startsWith('test:')).sort();for(const n of s){console.log('===',n);const r=spawnSync('npm',['run',n],{stdio:'inherit',shell:true});if(r.status)process.exit(r.status)}console.log('All',s.length,'suites passed')"
```

## PR delivery

Agents open PRs from `claude/**` branches. The founder merges on green CI plus an explicit verdict in the room. Agents do not merge, push to `main`, or deploy without that word.
