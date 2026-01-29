# List all recipes
default:
    @just --list --unsorted

##############################################
################ Common ######################
##############################################

# Install dependencies
[group('common')]
install:
    pnpm install

# Start dev server
[group('common')]
dev:
    pnpm dev

# Build for production
[group('common')]
build:
    pnpm build

##############################################
################ Lint ########################
##############################################

# Run all checks (lint + format check + test)
[group('lint')]
check: lint format-check test

# Run eslint
[group('lint')]
lint:
    pnpm lint

# Run eslint and fix auto-fixable issues
[group('lint')]
lint-fix:
    pnpm lint:fix

# Check code formatting
[group('lint')]
format-check:
    pnpm format:check

# Format code
[group('lint')]
format:
    pnpm format

##############################################
################ Test ########################
##############################################

# Run tests
[group('test')]
test:
    pnpm test:run

##############################################
################ Release #####################
##############################################

# Get current version from package.json
[private]
version:
    @jq -r '.version' package.json

# Create a new release (builds, tags, and creates GitHub release)
[group('release')]
release version:
    ./scripts/release.sh {{version}}

# Create a release from the current version in package.json
[group('release')]
release-current:
    just release "$(just version)"

##############################################
################ Local Testing ###############
##############################################

# SSH host for Home Assistant (set HA_SSH_HOST env var)
ha_ssh_host := env('HA_SSH_HOST')

# Sync built zen-ui.js to Home Assistant for local testing
[group('local-testing')]
sync:
    rsync -v --rsync-path="sudo rsync" dist/zen-ui.js {{ha_ssh_host}}:/homeassistant/www/community/zen-ui/

# Build and sync to Home Assistant
[group('local-testing')]
sync-build: build sync
