---
name: pathao-courier-integration
description: >
Reliably design, implement, audit, debug, and migrate Pathao Courier
integrations for real applications, especially Vercel Serverless and
MongoDB. The skill is intentionally provider-contract-driven and fluid:
it discovers the current Pathao API contract from authoritative sources,
verifies uncertain behavior before coding, adapts to the application's
existing architecture, and avoids hardcoded assumptions about endpoints,
payloads, webhook signatures, statuses, credentials, or SDKs.
Pathao Courier Integration Skill
Mission
Implement Pathao Courier integration correctly in the user's existing application.
Optimize for:
correctness over speed
current API contract over remembered examples
minimal architectural changes
secure server-side credentials
deterministic order/shipment state
idempotent dispatch
observable failures
safe webhook processing
easy sandbox → production migration
Never treat an old tutorial, unofficial SDK, generated guide, or previous answer as authoritative when it conflicts with current Pathao documentation or observed API behavior.
---
1. First inspect; do not redesign blindly
Before writing code:
Inspect the existing repository/application structure.
Identify:
frontend framework
serverless/runtime
API route conventions
database and schema
authentication/authorization
order creation flow
admin flow
existing payment flow
environment-variable conventions
Locate existing Pathao code, if any.
Read relevant order/database code before modifying it.
Preserve working architecture unless a concrete Pathao requirement forces a change.
If files/code are available, use them as the primary source for application-specific facts.
Ask questions only when a missing fact blocks a safe implementation. Otherwise make the smallest reasonable assumption and state it.
---
2. Verify the Pathao contract before implementation
Pathao's API can change. Do not hardcode remembered values as facts.
For every Pathao-specific implementation, establish and record:
environment/base URL
authentication endpoint
authentication request schema
authentication response schema
token expiration semantics
stores endpoint/schema
cities endpoint/schema
zones endpoint/schema
areas endpoint/schema
pricing endpoint/schema, if required
order creation endpoint/schema
order lookup/status endpoint/schema
cancellation endpoint/schema, if required
webhook configuration/handshake
webhook authentication/signature mechanism
webhook event schema
status/event vocabulary
error response format
rate limits/timeouts/retry guidance, if documented
Prefer authoritative Pathao sources. Pathao's current Merchant Help Center confirms that merchants can integrate their panel with their website and documents merchant delivery concepts; Pathao also currently describes Developer API and Webhook Integration for custom/high-volume systems. Use these as context, but do not invent undocumented API details from help articles.
Current public Pathao material:
Merchant Help Center: https://help.pathao.com/merchant-help-center/
Pathao merchant integration context: https://pathao.com/blog/pathao-commerce-instant-delivery/
If official API documentation is inaccessible, explicitly label secondary/unofficial material as secondary evidence and verify uncertain behavior with a sandbox request before relying on it.
---
3. Source hierarchy
Use this priority order:
Current official Pathao API/developer documentation
Current Pathao Merchant Dashboard behavior
Direct successful sandbox requests/responses
Current Pathao support/merchant help content
Maintained third-party SDK/source, clearly labeled unofficial
Old tutorials/blogs
Model memory
When sources disagree:
do not silently choose one
identify the conflict
test the smallest safe sandbox request
use the observed contract if it is consistent
document the decision
Never fabricate an endpoint, credential, header, status, payload field, or webhook signature scheme.
---
4. Security rules
Never expose Pathao credentials to the browser.
Secrets belong only in server-side environment variables, such as:
PATHAO_BASE_URL
PATHAO_CLIENT_ID
PATHAO_CLIENT_SECRET
PATHAO_USERNAME
PATHAO_PASSWORD
PATHAO_WEBHOOK_SECRET
Only use the exact variables required by the verified Pathao contract.
Never:
commit secrets
log access tokens
return secrets in API responses
accept Pathao credentials from frontend input
trust frontend-provided courier credentials
trust frontend-provided final COD amount
trust frontend-provided store ID when the backend can determine it
Normalize and validate customer phone/address input server-side.
---
5. Vercel Serverless rules
Assume serverless instances are ephemeral.
Do not rely on module-level memory for correctness.
Module-level caches may be used only as performance optimizations.
For Vercel + MongoDB:
use a reusable/cached MongoClient pattern
keep Pathao token caching optional and non-authoritative
if persistent token caching is useful, MongoDB can store token metadata
never assume two requests run on the same instance
keep external requests bounded with AbortController/timeouts
clear timers in `finally`
Do not introduce Redis/Vercel KV merely because the app is serverless.
---
6. Authentication implementation
Implement a single reusable Pathao client/service.
Conceptually:
```text
getAccessToken()
  -> validate in-process cache
  -> optionally check persistent cache
  -> authenticate if necessary
  -> validate response
  -> cache with a conservative safety margin
  -> return token
```
Do not subtract an arbitrary fixed amount from `expires_in`.
Use a bounded safety margin appropriate to the verified token lifetime, for example a few minutes, while preventing negative/zero effective lifetimes.
Prevent concurrent token-request storms when practical by sharing an in-flight authentication promise per serverless instance.
Never log the access token.
---
7. Order data authority
The backend is authoritative for:
order existence
product prices
quantities
discounts
shipping fee
final total
COD amount
merchant order ID
Pathao store ID
shipment eligibility
shipment state
Do not trust:
```text
amount_to_collect
store_id
merchant_order_id
unit prices
total
shipping fee
```
from the frontend without server-side verification.
Calculate COD from the canonical order in MongoDB.
---
8. Location handling
If the verified Pathao order contract requires Pathao location IDs, do not send arbitrary customer text as a substitute.
Model the distinction between:
```text
customer-entered address
Pathao city ID
Pathao zone ID
Pathao area ID
```
Keep the Pathao IDs associated with the order so a later shipment creation uses the same validated location.
If the current contract does not require a field, do not invent it.
Location mappings may be cached in MongoDB, but the backend must validate that IDs are valid and compatible.
---
9. Order creation architecture
Prefer this general flow unless the existing product requires otherwise:
```text
Customer checkout
    ↓
Backend creates canonical MongoDB order
    ↓
Admin/order workflow confirms shipment eligibility
    ↓
Server-side dispatch endpoint
    ↓
Load canonical order from MongoDB
    ↓
Check shipment already exists
    ↓
Validate shipment data
    ↓
Get Pathao token
    ↓
Create Pathao shipment
    ↓
Persist returned Pathao identifiers
    ↓
Return safe result
```
Automatic dispatch may be used if explicitly desired, but the same validation/idempotency rules apply.
---
10. Idempotency is mandatory
Before creating a shipment:
```text
Does this internal order already have a Pathao shipment?
    YES -> return existing shipment; do not create another
    NO  -> continue
```
Use a stable merchant order identifier derived from the internal order.
Back this with a database constraint/index where appropriate.
Design for the failure case:
```text
Pathao creates shipment
    ↓
Vercel crashes before MongoDB update
    ↓
retry happens
```
The retry must not blindly create a second shipment.
If the Pathao contract provides an order lookup/reconciliation operation, use it.
---
11. Validation rules
Reject invalid values instead of silently changing them.
Do not do:
```js
Math.max(...)
Math.min(...)
parseInt(x) || default
```
for business-critical values unless the default/clamp is an explicit business rule.
Validate:
phone format
required names
address length/content
quantity
weight
amount
location IDs
delivery/item types
merchant order ID
store ID
If Pathao has a documented allowed range, enforce it with a clear 4xx error.
---
12. Pathao HTTP client behavior
Every external Pathao request should:
construct URL from configured environment
set required authorization headers
set JSON content headers where appropriate
use AbortController
enforce a reasonable timeout
read the response safely
preserve the original HTTP status
parse JSON only when possible
return useful sanitized error details
never leak credentials/tokens
Never assume a non-2xx response is JSON.
Safe pattern:
```js
const text = await response.text();

let details;
try {
  details = JSON.parse(text);
} catch {
  details = text;
}
```
Retain the raw upstream status and useful validation errors in server logs, while sanitizing secrets and personal data.
---
13. Error classification
Classify failures instead of treating everything as HTTP 500.
Typical categories:
```text
400/422 -> invalid request/business data; do not blindly retry
401     -> token/credential problem; refresh/re-authenticate carefully
403     -> permission/account/store problem
404     -> wrong resource/endpoint
409     -> duplicate/conflict; reconcile
429     -> rate limiting; backoff if appropriate
5xx     -> upstream failure; retry only when safe/idempotent
timeout -> transient; retry only when safe
network -> transient; retry only when safe
```
The exact behavior must follow the verified Pathao contract.
---
14. MongoDB state model
Do not store only a single `orderStatus`.
Keep courier-specific state separately.
Example:
```js
courier: {
  provider: "pathao",
  shipmentCreated: false,
  storeId: null,
  merchantOrderId: null,
  consignmentId: null,
  trackingCode: null,
  deliveryFee: null,
  pathaoStatus: null,
  lastWebhookAt: null
}
```
Keep the internal order status independent:
```text
orderStatus: "processing"
courier.pathaoStatus: "order.in_transit"
```
Do not collapse every Pathao event into `dispatched`.
Preserve the raw/current Pathao event/status when the contract provides it.
---
15. Webhooks
Do not implement webhook authentication from memory.
First verify the current Pathao webhook contract.
Then implement:
```text
Pathao webhook
    ↓
HTTP method check
    ↓
authentication/signature/secret verification
    ↓
raw-body handling if required
    ↓
schema validation
    ↓
identify order by stable Pathao/merchant identifier
    ↓
idempotent MongoDB update
    ↓
fast 2xx response
```
If the verified signature scheme requires raw bytes, verify before parsing/re-serializing JSON.
Do not call an unverified HMAC algorithm merely because another guide mentions HMAC.
Do not compare a secret directly unless Pathao's verified contract explicitly requires that behavior.
---
16. Webhook idempotency
Assume webhook delivery can be duplicated.
A webhook handler must safely process:
```text
event A
event A again
event A again
```
Do not trigger duplicate side effects.
If the application sends:
SMS
email
refund
inventory changes
accounting actions
then use event IDs or another durable deduplication mechanism if provided/available.
For simple status `$set` operations, make updates monotonic where appropriate and avoid moving an order backward because of an older event.
---
17. Shipment creation + MongoDB consistency
Handle this failure:
```text
Pathao shipment succeeds
MongoDB update fails
```
Use reconciliation.
If Pathao exposes a lookup endpoint, periodically or manually reconcile orders stuck in:
```text
shipment_creation = unknown
```
Do not report "shipment failed" merely because the database update failed after Pathao accepted the order.
---
18. Sandbox-first workflow
Always test:
authentication
store lookup
location lookup
pricing, if used
minimal valid order creation
response persistence
duplicate dispatch protection
webhook handshake/configuration
webhook event processing
failure handling
production environment separation
Do not test production by creating a real shipment and immediately cancelling it unless Pathao explicitly instructs you to do so.
---
19. Debugging 422 errors
When a 422 occurs, do not randomly change fields.
Capture:
```text
HTTP method
URL path
request headers excluding secrets
sanitized request body
Pathao response status
complete Pathao response body
order ID
environment (sandbox/production)
store ID
token success/failure
```
Then classify the error.
Compare the request against the current verified schema field-by-field.
Never hide the upstream validation body with:
```js
JSON.parse(errorText)
```
without a fallback.
A 422 is usually a contract/data problem, not a Vercel problem.
---
20. SDK policy
Do not require an SDK.
Prefer native `fetch()` when:
the Pathao API is small enough
the current contract is clear
the application already uses serverless functions
An unofficial SDK may be inspected as a reference implementation, but its behavior must not override current official documentation or successful sandbox behavior.
If an SDK is used, verify:
maintenance status
package version
source
endpoint definitions
authentication behavior
webhook behavior
license
compatibility with the deployed Node runtime
---
21. Environment separation
Never silently fall back from production to sandbox.
Prefer:
```text
Development -> sandbox credentials/base URL
Preview     -> sandbox credentials/base URL
Production  -> production credentials/base URL
```
Require production variables explicitly.
Fail clearly when required environment variables are missing.
Never log their values.
---
22. Observability
Log structured, sanitized information:
```text
pathao.operation
pathao.status
pathao.environment
internal.orderId
merchantOrderId
consignmentId
durationMs
error.category
```
Never log:
client secret
client password
access token
webhook secret
full customer address unless genuinely required
unnecessary personal data
---
23. Implementation output
When implementing, produce:
architecture summary
verified Pathao contract
environment variables
MongoDB schema changes
reusable Pathao client
authentication/token handling
location integration if required
shipment creation endpoint
webhook endpoint
idempotency/reconciliation logic
frontend/admin integration
sandbox test procedure
production migration procedure
failure/debugging procedure
Keep code modular.
Do not create a giant single API file containing authentication, MongoDB, Pathao, validation, and webhook logic.
---
24. What not to do
Never:
expose Pathao credentials client-side
invent undocumented endpoints
invent webhook signatures
assume old sandbox credentials are valid
trust frontend COD amounts
trust frontend store IDs
silently clamp invalid business data
create duplicate shipments on retry
assume serverless memory is persistent
assume webhooks arrive exactly once
assume every upstream error is JSON
hide the actual Pathao validation response
replace the existing database architecture unnecessarily
add Redis/KV/queues without a demonstrated need
deploy production before sandbox behavior is verified
---
25. Adaptive behavior
This skill must remain fluid.
If the user's application changes from:
```text
Vercel + MongoDB
```
to:
```text
Cloudflare Workers + D1
```
or:
```text
Next.js + PostgreSQL
```
adapt the implementation while preserving the same invariants:
```text
server-side secrets
correct Pathao contract
validated data
idempotent shipment creation
durable courier state
secure webhook processing
reconciliation
sandbox-first testing
```
Do not force MongoDB-specific patterns onto another database.
Likewise, do not force Vercel-specific patterns onto another runtime.
---
26. Decision rule
When uncertain:
```text
Can this be verified from the current Pathao contract?
    YES -> verify it
    NO  -> test safely in sandbox or ask for the missing evidence

Can this be derived from the existing application's code/data?
    YES -> inspect it
    NO  -> ask only if it blocks correctness

Is this a business rule?
    YES -> do not invent it; ask or preserve existing behavior

Is this an implementation optimization?
    YES -> keep it simple and optional
```
The goal is not to produce the most elaborate integration.
The goal is to produce the smallest implementation that is demonstrably correct for the user's current Pathao account, API contract, application architecture, and business flow.