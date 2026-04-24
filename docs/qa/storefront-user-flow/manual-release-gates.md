# Storefront Manual Release Gates

Run these gates before approving a storefront release. Automated Playwright coverage now verifies read-only storefront discovery, configured social-login entry points, guarded cart/checkout paths, order tracking, and review UI behavior, but the checks below still require real sandbox services or business approval.

| Gate | Owner | Required Evidence | Status |
| --- | --- | --- | --- |
| Real payment gateway sandbox | QA + Engineering | Successful sandbox payment through the enabled gateway, failed/declined payment path, and no duplicate order/payment on double click. | Manual |
| Notification logs | QA + Engineering | Order confirmation email visible in Mailpit/Mailhog/log/mail provider test sink. SMS confirmation visible only when a test SMS provider/stub is configured. | Manual/test-sink |
| Social OAuth redirects | QA + Engineering | Google/Facebook/Twitter buttons appear only when provider flags and credentials are enabled; redirect reaches the provider sandbox and callback returns to the storefront. | Manual/sandbox |
| Return/refund eligibility | QA + Support | Delivered order allows return request when policy permits; processing/cancelled/non-returnable orders hide or reject return request with clear messaging. | Manual |
| Review eligibility | QA + Support | Delivered purchased product allows one review; non-delivered, not-purchased, or already-reviewed products are rejected by backend and clearly explained in UI. | Partially automated |
| Mobile cart/checkout | QA | 375px, 390px, and 430px viewport pass for cart, guest checkout, address validation, order review, payment buttons, and error banners without overlap. | Manual |
| Disposable mutation environment | Engineering | `E2E_ALLOW_MUTATION=true` and `E2E_DB_IS_DISPOSABLE=true` point to a disposable database only; never production/staging shared data. | Required before mutation runs |

## Notification Sink Setup

Preferred local options:

- Laravel array/log mail driver for backend feature tests: `MAIL_DRIVER=array` or `MAIL_DRIVER=log`.
- Mailpit/Mailhog for browser-visible E2E checks: set `E2E_MAIL_LOG_URL` to the sink API endpoint.
- SMS remains manual unless `E2E_SMS_LOG_URL` points to a provider stub or internal test sink.

## Release Sign-Off

Record the release date, environment URL, Playwright command output, sandbox transaction/reference IDs, notification sink links, and any accepted risks in the release checklist or ticket.
