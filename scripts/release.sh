#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:?Usage: release.sh <version>}"

# Update version in package.json
jq ".version = \"${VERSION}\"" package.json > package.json.tmp
mv package.json.tmp package.json

# Run checks
just check

# Build
just build

# Commit version bump
git add package.json
git commit -m "chore: bump version to ${VERSION}"

# Create and push tag
git tag -a "v${VERSION}" -m "Release v${VERSION}"
git push origin HEAD
git push origin "v${VERSION}"

# Create GitHub release with the built file
gh release create "v${VERSION}" \
    --title "v${VERSION}" \
    --generate-notes \
    dist/zen-ui.js
