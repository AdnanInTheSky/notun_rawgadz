// api/admin/pathao.js
// POST /api/admin/pathao — Dispatch an order to Pathao Courier Merchant API v1

const { getDb } = require("../_db");
const { pathaoRequest } = require("../../lib/pathao");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { invoice_number } = req.body || {};

  // 1. Request Validation
  if (!invoice_number || typeof invoice_number !== "string") {
    return res.status(400).json({ error: "invoice_number is required" });
  }

  let ordersCol = null;
  try {
    const client = await getDb();
    ordersCol = client.db("paystationdemo").collection("orders");
  } catch (err) {
    return res.status(500).json({ error: "Database connection failed", details: err.message });
  }

  // 2. Atomic Database Lock (CRITICAL to prevent race conditions & duplicate dispatches)
  // Lock the order by setting courier_status = 'dispatching' ONLY IF it is not already dispatching or dispatched
  let lockedOrder = null;
  try {
    const filter = {
      invoice_number: invoice_number,
      courier_status: { $nin: ["dispatching", "dispatched"] }
    };

    const update = {
      $set: {
        courier_status: "dispatching",
        updated_at: new Date()
      }
    };

    // Use findOneAndUpdate to atomically acquire lock
    const result = await ordersCol.findOneAndUpdate(filter, update, { returnDocument: "before" });
    lockedOrder = result.value !== undefined ? result.value : result;
  } catch (dbLockErr) {
    return res.status(500).json({ error: "Failed to lock order record in database", details: dbLockErr.message });
  }

  if (!lockedOrder) {
    return res.status(409).json({
      error: "Order is already dispatching, dispatched, or does not exist."
    });
  }

  // 3. Data Assembly & Payload Mapping
  try {
    const storeId = parseInt(process.env.PATHAO_STORE_ID, 10);
    if (!storeId || isNaN(storeId)) {
      throw new Error("Missing or invalid PATHAO_STORE_ID in environment variables");
    }

    const customer = lockedOrder.customer || {};
    const items = lockedOrder.items || [];

    // Calculate total quantity & total weight (minimum 0.5kg)
    const itemQuantity = items.reduce((sum, item) => sum + (parseInt(item.qty || item.quantity, 10) || 1), 0) || 1;
    const itemWeight = Math.max(0.5, itemQuantity * 0.5);

    // Format phone number to 11 digits starting with 01
    let phone = (customer.phone || "").replace(/\s/g, "");
    if (!phone.startsWith("01")) {
      phone = `01${phone}`.slice(0, 11);
    }

    // Determine amount to collect (0 if paid via PayStation online, full amount if COD)
    const isPaidOnline = lockedOrder.status === "success" || lockedOrder.verified === true;
    const amountToCollect = isPaidOnline ? 0 : Math.round(Number(lockedOrder.payment_amount) || 0);

    const fullAddress = customer.full_address || customer.address_detail || "N/A";

    const pathaoPayload = {
      store_id: storeId,
      merchant_order_id: lockedOrder.invoice_number,
      recipient_name: customer.name || "Valued Customer",
      recipient_phone: phone,
      recipient_address: fullAddress,
      delivery_type: 48, // 48: Normal delivery
      item_type: 2,      // 2: Parcel
      item_quantity: itemQuantity,
      item_weight: itemWeight,
      item_description: lockedOrder.checkout_items || "Ecommerce Order",
      amount_to_collect: amountToCollect
    };

    // 4. API Dispatch to Pathao
    const responseData = await pathaoRequest("/aladdin/api/v1/orders", {
      method: "POST",
      body: JSON.stringify(pathaoPayload)
    });

    const consignmentId = responseData.consignment_id || responseData.data?.consignment_id || responseData.data?.consignment_number || "DISPATCHED";

    // 5. State Reconciliation — Success Path
    await ordersCol.updateOne(
      { invoice_number: lockedOrder.invoice_number },
      {
        $set: {
          courier_status: "dispatched",
          consignment_id: consignmentId,
          pathao_response: responseData,
          updated_at: new Date()
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: "Order dispatched to Pathao successfully",
      consignment_id: consignmentId,
      invoice_number: lockedOrder.invoice_number,
      data: responseData
    });

  } catch (dispatchErr) {
    // 6. State Reconciliation — Failure Path
    try {
      await ordersCol.updateOne(
        { invoice_number: lockedOrder.invoice_number },
        {
          $set: {
            courier_status: "failed",
            pathao_error: dispatchErr.message,
            updated_at: new Date()
          }
        }
      );
    } catch (e) { /* silent */ }

    return res.status(500).json({
      error: dispatchErr.message || "Failed to dispatch order to Pathao"
    });
  }
};
