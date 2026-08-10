You are a Principal Backend Engineer specializing in Node.js, Vercel Serverless Functions, and MongoDB.

Context: We have a serverless e-commerce architecture.

Frontend: Lit Web Components.

Backend: Vercel serverless functions in an api/ directory.

Database: MongoDB via a singleton connection helper in api/_db.js.

Payments: PayStation integration already handles online payments and sets order status to "success" (or "failed").

Current goal: Integrate the Pathao Courier Merchant API v1 so an admin can click a button to dispatch an order with one click.

Objective: Write the complete backend implementation and frontend button logic to dispatch a Pathao courier order securely, preventing race conditions (duplicate dispatches) and data corruption. Do not use external Pathao SDKs; write native fetch wrappers.

1. Environment & Database Pre-requisites
Database Schema Updates: The paystationdemo.orders collection must now support two new fields:

courier_status (String): "pending", "dispatching", "dispatched", or "failed". Default is "pending".

consignment_id (String): Nullable, stores the Pathao ID (e.g., "RED123456") after a successful dispatch.

Environment Variables: Assume the existence of:

PATHAO_BASE_URL (e.g., [https://courier-api-sandbox.pathao.com](https://courier-api-sandbox.pathao.com) or [https://api-hermes.pathao.com](https://api-hermes.pathao.com))

PATHAO_CLIENT_ID, PATHAO_CLIENT_SECRET, PATHAO_USERNAME, PATHAO_PASSWORD, PATHAO_STORE_ID

2. Create lib/pathao.js (API Wrapper)
Write a helper module that does two things:

getPathaoToken(): Requests an access token from POST /aladdin/api/v1/issue-token using grant_type: "password" and the environment variables. Crucial: Implement token caching either in-memory (with awareness of serverless cold starts) or preferably in a MongoDB collection so we don't hit the auth endpoint on every request.

pathaoRequest(endpoint, options): A generic fetch wrapper that injects the Bearer token, sets Content-Type: application/json, and parses the response safely (handling 502 HTML gateway errors defensively).

3. Create /api/admin/pathao.js (The Serverless Handler)
Write this endpoint to strictly follow this execution order:

Request Validation: Accept only POST requests containing { "invoice_number": "INV-..." }.

Authentication/Security: Ensure basic admin authentication/session validation is checked before proceeding.

Atomic Database Lock (CRITICAL): Use MongoDB's findOneAndUpdate. Query for invoice_number WHERE courier_status is $nin: ['dispatching', 'dispatched'] and status is "success" (meaning payment is verified). In the exact same operation, $set: { courier_status: 'dispatching' }. If this returns null, return a 409 Conflict (someone already clicked the button).

Data Assembly & Payload Mapping: Transform the MongoDB order data into the exact Pathao V1 payload.

store_id: process.env.PATHAO_STORE_ID (Integer)

merchant_order_id: The invoice_number (String)

recipient_name: Customer's name (String)

recipient_phone: Customer's phone (Must be 11 digits starting with 01)

recipient_address: Customer's full address string (Pathao's updated API auto-resolves city/zone from this, do not send recipient_city or recipient_zone).

delivery_type: 48 (Normal delivery)

item_type: 2 (Parcel)

item_quantity: Calculate from DB order items.

item_weight: Calculate from DB order items (Minimum 0.5).

item_description: "Ecommerce Order"

amount_to_collect: If payment_amount covers the whole order (PayStation success), this MUST be 0. If COD, it must be the total order amount. (Number)

API Dispatch: Call pathaoRequest("/aladdin/api/v1/orders", { method: "POST", body: ... }).

State Reconciliation:

On success (2xx): $set: { courier_status: 'dispatched', consignment_id: response.consignment_id } and return 200 OK.

On failure (timeout, 4xx, 5xx): $set: { courier_status: 'failed' } and return 400/500 with the exact error message so the admin can try again.

4. Frontend Admin Integration (Lit / HTML)
Provide the JS snippet for the "Send to Pathao" button logic in the admin dashboard:

The button must take the invoice_number as an argument.

On click, immediately set the button disabled = true and change the text to "Dispatching..." to prevent double clicks.

Send the POST /api/admin/pathao request.

Parse the JSON response. If successful, replace the button UI with the consignment_id. If it fails, alert the exact error and re-enable the button.

Constraints: Write clean, modular Node.js code using async/await. Use try/catch heavily. Include descriptive comments. Spare no details on the MongoDB update operators and error handling.