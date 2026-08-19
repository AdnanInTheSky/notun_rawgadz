// admin/api/pathao.js
// POST /api/pathao — Dispatch order to Pathao Courier Merchant API v1

const { getDb } = require("./_db");
const { pathaoRequest } = require("./_pathao");

function formatBDPhone(rawPhone) {
  if (!rawPhone) return "";
  let digits = rawPhone.toString().replace(/[^\d]/g, "");
  if (digits.startsWith("8801")) {
    digits = digits.slice(2);
  }
  if (!digits.startsWith("01")) {
    digits = "01" + digits;
  }
  return digits.slice(0, 11);
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

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

  // 2. Atomic Database Lock (Idempotent dispatch protection)
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

    const result = await ordersCol.findOneAndUpdate(filter, update, { returnDocument: "before" });
    lockedOrder = result.value !== undefined ? result.value : result;
  } catch (dbLockErr) {
    return res.status(500).json({ error: "Failed to acquire lock for order in database", details: dbLockErr.message });
  }

  if (!lockedOrder) {
    // Check if order exists and is already dispatched
    const existingOrder = await ordersCol.findOne({ invoice_number });
    if (existingOrder && (existingOrder.courier_status === "dispatched" || existingOrder.consignment_id)) {
      return res.status(409).json({
        error: "Order is already dispatched to Pathao Courier",
        consignment_id: existingOrder.consignment_id,
        invoice_number
      });
    }

    return res.status(409).json({
      error: "Order is currently dispatching or does not exist."
    });
  }

  // 3. Data Validation & Payload Mapping
  try {
    const storeId = parseInt(process.env.PATHAO_STORE_ID || "1", 10);
    if (!storeId || isNaN(storeId)) {
      throw new Error("Missing or invalid PATHAO_STORE_ID in environment variables");
    }

    const customer = lockedOrder.customer || {};
    const items = lockedOrder.items || [];

    // Format & validate phone number (01XXXXXXXXX)
    const phone = formatBDPhone(customer.phone);
    if (!/^01[3-9]\d{8}$/.test(phone)) {
      throw new Error(`Invalid recipient phone number '${customer.phone}'. Must be a valid 11-digit Bangladeshi mobile number (e.g. 01712345678).`);
    }

    // Format & validate address (Pathao requires minimum 10 characters)
    let fullAddress = (customer.full_address || customer.address_detail || "").trim();
    if (fullAddress.length < 10) {
      fullAddress = `${fullAddress}, Bangladesh (Verified Order)`.slice(0, 300);
      if (fullAddress.length < 10) {
        throw new Error("Recipient address is too short. Pathao requires at least 10 characters.");
      }
    }

    // Calculate total quantity & total weight (minimum 0.5kg)
    const itemQuantity = items.reduce((sum, item) => sum + (parseInt(item.qty || item.quantity, 10) || 1), 0) || 1;
    const itemWeight = Math.max(0.5, itemQuantity * 0.5);

    // Determine amount to collect based on backend order payment_method & status
    const paymentMethod = (lockedOrder.payment_method || "").toLowerCase();
    const isCod = paymentMethod === "cod";
    const isPaidOnline = !isCod && (lockedOrder.status === "success" || lockedOrder.trx_status === "success");
    const amountToCollect = isPaidOnline ? 0 : Math.round(Number(lockedOrder.payment_amount) || 0);

    // Location IDs with configured/standard Dhaka defaults
    const cityId = customer.city_id ? parseInt(customer.city_id, 10) : parseInt(process.env.PATHAO_CITY_ID || "1", 10);
    const zoneId = customer.zone_id ? parseInt(customer.zone_id, 10) : parseInt(process.env.PATHAO_ZONE_ID || "1", 10);
    const areaId = customer.area_id ? parseInt(customer.area_id, 10) : parseInt(process.env.PATHAO_AREA_ID || "1", 10);

    const pathaoPayload = {
      store_id: storeId,
      merchant_order_id: lockedOrder.invoice_number,
      recipient_name: customer.name || "Valued Customer",
      recipient_phone: phone,
      recipient_address: fullAddress,
      recipient_city: cityId,
      recipient_zone: zoneId,
      recipient_area: areaId,
      delivery_type: 48, // 48: Normal delivery
      item_type: 2,      // 2: Parcel
      item_quantity: itemQuantity,
      item_weight: itemWeight,
      item_description: lockedOrder.checkout_items || "Ecommerce Order",
      amount_to_collect: amountToCollect
    };

    // 4. API Dispatch Call to Pathao
    const responseData = await pathaoRequest("/aladdin/api/v1/orders", {
      method: "POST",
      body: JSON.stringify(pathaoPayload)
    });

    const consignmentId = responseData.consignment_id || responseData.data?.consignment_id || responseData.data?.consignment_number || "DISPATCHED";

    // 5. State Reconciliation & Persistence
    const updatePayload = {
      courier_status: "dispatched",
      consignment_id: consignmentId,
      courier: {
        provider: "pathao",
        status: "dispatched",
        consignment_id: consignmentId,
        store_id: storeId,
        amount_to_collect: amountToCollect,
        dispatched_at: new Date()
      },
      pathao_response: responseData,
      updated_at: new Date()
    };

    await ordersCol.updateOne(
      { invoice_number: lockedOrder.invoice_number },
      { $set: updatePayload }
    );

    return res.status(200).json({
      success: true,
      message: "Order dispatched to Pathao Courier successfully",
      consignment_id: consignmentId,
      invoice_number: lockedOrder.invoice_number,
      data: responseData
    });

  } catch (dispatchErr) {
    // 6. Error Handling & State Recovery
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

    const statusCode = dispatchErr.status || 500;
    return res.status(statusCode).json({
      error: dispatchErr.message || "Failed to dispatch order to Pathao Courier",
      details: dispatchErr.data || null
    });
  }
};
