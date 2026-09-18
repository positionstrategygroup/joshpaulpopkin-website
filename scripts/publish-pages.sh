#!/usr/bin/env bash
# Build the site and publish /public to the gh-pages branch of
# positionstrategygroup/joshpaulpopkin-website (GitHub Pages serves www.joshpaulpopkin.com).
set -euo pipefail
cd "$(dirname "$0")/.."
node build.js
cd public
rm -rf .git
git init -q && git checkout -q -b gh-pages
git add -A
git -c user.email=josh@positionstrategygroup.com -c user.name="Josh Popkin" commit -qm "Publish $(date -u +%Y-%m-%dT%H:%MZ)"
git push -q -f https://github.com/positionstrategygroup/joshpaulpopkin-website.git gh-pages
cd ..
node scripts/indexnow.js || true
echo "published to gh-pages"
