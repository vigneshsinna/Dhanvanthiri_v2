# 18 — Environment, Config, Secrets, and Deployment Checklist

## Objective
Make sure the old frontend can run against the new headless backend reliably across local, staging, and production environments.

## Environment variables
### Frontend
- API base URL
- live storefront URL used by backend panels (`FRONTEND_URL`)
- public asset base URL if needed
- environment name
- analytics keys
- feature flag source or defaults
- payment public keys
- error tracking DSN

### Backend dependencies the frontend depends on
- auth configuration
- allowed origins/CORS
- payment gateway keys
- webhook callback URLs
- image/media base URL

## Secrets handling rules
- never hardcode credentials in client code
- use separate staging and production keys
- rotate credentials during cutover if needed
- document secret owners and rotation process

## Deployment prerequisites
- CORS configured for the old frontend origin
- API rate limiting reviewed
- SSL/TLS valid on both origins
- correct callback URLs for payment providers
- CDN/static asset policy confirmed
- cache invalidation rules prepared

## Frontend deployment tasks
- environment-specific build config
- verify source maps and error tracking
- verify hashed asset delivery
- verify fallback routing for SPA paths
- verify backend "Browse Website" opens the configured live storefront URL

## Public cutover routing
- `/api/*` stays on Laravel
- `/admin/*` stays on Laravel
- `/storage/*` and backend public assets stay on Laravel/public storage
- all other public storefront routes should resolve to the React `index.html`
- unknown customer-facing routes should use SPA fallback, not Laravel `route('home')`

## Backend coordination tasks
- enable required APIs
- verify response caching rules
- confirm media and file URLs
- confirm auth/session settings
- confirm webhook and cron dependencies

## Smoke checklist
- login
- home page
- category page
- PDP
- add to cart
- address save
- checkout
- payment
- order success
- order history

## Acceptance criteria
- environment values are documented and validated
- staging mirrors production closely enough for payment and auth
- deployment can be repeated without manual guesswork
