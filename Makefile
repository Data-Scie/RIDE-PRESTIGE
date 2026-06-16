# Use Git for Windows' bash for recipes so this works from PowerShell/cmd too,
# not just from a Git Bash terminal. Override with `make SHELL=bash ...` if
# Git is installed somewhere other than the default location below.
ifeq ($(OS),Windows_NT)
  SHELL := C:/Program Files/Git/bin/bash.exe
else
  SHELL := bash
endif
.ONESHELL:
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help

API_URL ?= http://localhost:4000

.PHONY: help install dev dev-all dev-api dev-web dev-customer dev-operator \
        build build-api build-web check lint lint-web lint-mobile \
        test test-lifecycle test-driver-applications test-independent-dispatch \
        db-generate db-migrate db-push db-seed db-studio db-cleanup-mocks db-rotate-passwords \
        clean

help: ## Show this help
	@echo "Ride Prestige - available targets:"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-24s\033[0m %s\n", $$1, $$2}'

# ─── Setup ──────────────────────────────────────────────────────────────────

install: ## Install dependencies for every workspace
	npm install

# ─── Development servers ───────────────────────────────────────────────────

dev: ## Run the API + web portals together
	npm run dev

dev-all: ## Run API + web + both mobile apps together
	npm run dev:all

dev-api: ## Run only the API (port 4000)
	npm run dev:api

dev-web: ## Run only the Next.js web app (admin/ops/affiliate/driver portals)
	npm run dev:web

dev-customer: ## Run the customer mobile app (Expo)
	npm run dev:mobile-customer

dev-operator: ## Run the affiliate/driver mobile app (Expo)
	npm run dev:mobile-operator

# ─── Build & lint ───────────────────────────────────────────────────────────

build: build-api build-web ## Build the API and the web app

build-api: ## Type-check and compile the API
	npm run build:api

build-web: ## Type-check and build the Next.js web app
	npm run build:web

check: ## Build API + web and lint both mobile apps (CI-equivalent)
	npm run check

lint: lint-web lint-mobile ## Lint the web app and both mobile apps

lint-web: ## Lint the Next.js web app
	npm run lint:web

lint-mobile: ## Lint both mobile apps
	npm run lint:mobile

# ─── Tests ──────────────────────────────────────────────────────────────────

test: ## Boot a local API against the configured DB and run all lifecycle tests
	cd apps/api && npm run dev > /tmp/rp-api-test.log 2>&1 &
	api_pid=$$!
	trap 'kill $$api_pid 2>/dev/null || true' EXIT
	echo "Waiting for API to come up at $(API_URL)/health..."
	for i in $$(seq 1 30); do
		if curl -fs "$(API_URL)/health" > /dev/null 2>&1; then break; fi
		sleep 1
	done
	curl -fs "$(API_URL)/health" > /dev/null || { echo "API never became healthy — see /tmp/rp-api-test.log"; cat /tmp/rp-api-test.log; exit 1; }
	cd apps/api
	API_URL=$(API_URL) npm run test:driver-applications
	API_URL=$(API_URL) npm run test:ride-lifecycle
	API_URL=$(API_URL) npm run test:independent-dispatch

test-lifecycle: ## Run only the booking->affiliate->driver->completion lifecycle test (needs API running)
	cd apps/api && API_URL=$(API_URL) npm run test:ride-lifecycle

test-driver-applications: ## Run only the driver application/approval lifecycle test (needs API running)
	cd apps/api && API_URL=$(API_URL) npm run test:driver-applications

test-independent-dispatch: ## Run only the independent-driver dispatch test (needs API running)
	cd apps/api && API_URL=$(API_URL) npm run test:independent-dispatch

# ─── Database ───────────────────────────────────────────────────────────────

db-generate: ## Regenerate the Prisma client
	npm run db:generate

db-migrate: ## Run Prisma migrations against DATABASE_URL
	npm run db:migrate

db-push: ## Push the Prisma schema without creating a migration
	cd apps/api && npm run db:push

db-seed: ## Seed demo data (admins, affiliates, drivers, fleet, jobs)
	npm run db:seed

db-studio: ## Open Prisma Studio against DATABASE_URL
	npm run db:studio

db-cleanup-mocks: ## Remove leftover mock/test data from the database
	cd apps/api && npm run db:cleanup-mocks

db-rotate-passwords: ## Rotate default seed passwords before going live
	cd apps/api && npm run db:rotate-default-passwords

# ─── Housekeeping ───────────────────────────────────────────────────────────

clean: ## Remove build artifacts and installed dependencies
	rm -rf apps/api/dist apps/web/.next
	rm -rf node_modules apps/*/node_modules packages/*/node_modules
