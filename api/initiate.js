// api/initiate.js
// POST /api/initiate — Production grade, zero logging

const { ObjectId } = require("mongodb");
const { getDb }    = require("./_db");

const BASE = process.env.PAYSTATION_ENV === "live"
  ? "https://api.paystation.com.bd"
  : "https://sandbox.paystation.com.bd";

function generateInvoice() {
  try {
    return "INV-" + new ObjectId().toHexString();
  } catch (e) {
    return "INV-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
  }
}

function calcTotal(items, cartItems, amount) {
  const rawItems = Array.isArray(items) && items.length > 0
    ? items
    : (Array.isArray(cartItems) ? cartItems : []);

  let subtotal = 0, totalDelivery = 0;
  const lineItems = [];

  if (rawItems.length > 0) {
    for (const item of rawItems) {
      const id = item.id || item.subProductId || "prod";
      const name = item.name || item.title || item.subTitle || "Product";
      const price = parseFloat(item.price) || 0;
      const delivery = parseFloat(item.delivery) || 0;
      const qty = parseInt(item.qty || item.quantity, 10) || 1;

      const itemSubtotal = price * qty;
      const itemDelivery = delivery * qty;
      subtotal += itemSubtotal;
      totalDelivery += itemDelivery;

      lineItems.push({
        id,
        name,
        price,
        delivery,
        qty,
        subtotal: itemSubtotal,
      });
    }
  }

  let total = subtotal + totalDelivery;
  if (total <= 0 && typeof amount === "number" && amount > 0) {
    total = amount;
    subtotal = amount;
  }

  if (total <= 0) throw new Error("Cart total must be greater than zero");
  return { total, subtotal, totalDelivery, lineItems };
}

function sanitise(str, max = 200) {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, max);
}

function validatePhone(phone) {
  return /^01[0-9]{9}$/.test(phone.replace(/\s/g, ""));
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};
  const {
    items,
    cartItems,
    cust_name,
    cust_phone,
    cust_email,
    jela,
    thana,
    address_detail,
    cust_address,
    amount,
  } = body;

  const name   = sanitise(cust_name, 100);
  const phone  = sanitise(cust_phone, 20).replace(/\s/g, "");
  const email  = sanitise(cust_email, 200);
  const jl     = sanitise(jela, 50);
  const thn    = sanitise(thana, 50);
  const detail = sanitise(address_detail || cust_address, 300);
  const full_address = cust_address || [detail, thn, jl].filter(Boolean).join(", ") || "N/A";

  if (!name)                 return res.status(400).json({ error: "Name is required" });
  if (!validatePhone(phone)) return res.status(400).json({ error: "Invalid phone number (e.g. 01XXXXXXXXX)" });
  if (!validateEmail(email)) return res.status(400).json({ error: "Invalid email address" });

  let total, subtotal, totalDelivery, lineItems;
  try {
    ({ total, subtotal, totalDelivery, lineItems } = calcTotal(items, cartItems, amount));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const invoice_number = generateInvoice();
  const APP_URL        = process.env.APP_URL || "";
  const callback_url   = `${APP_URL}/api/callback`;
  const checkout_items = lineItems.length > 0
    ? lineItems.map(i => `${i.name} x${i.qty}`).join(", ")
    : `Order Total BDT ${total}`;

  let ordersCol = null;
  try {
    const client = await getDb();
    ordersCol = client.db("paystationdemo").collection("orders");
  } catch (err) {
    // Continue without DB if unavailable
  }

  const orderDoc = {
    invoice_number,
    subtotal, delivery_charge: totalDelivery, payment_amount: total,
    currency: "BDT", status: "initiated", verified: false,
    customer: { name, phone, email, jela: jl, thana: thn, address_detail: detail, full_address },
    items: lineItems, checkout_items, callback_url,
    payment_url: null, trx_id: null, trx_status: null,
    created_at: new Date(), updated_at: new Date(),
  };

  if (ordersCol) {
    try { await ordersCol.insertOne(orderDoc); } catch (e) { /* silent */ }
  }

  if (!process.env.MERCHANT_ID || !process.env.PAYSTATION_PASSWORD) {
    return res.status(200).json({
      success: true,
      message: "Order placed (Gateway credentials not set in environment)",
      invoice_number
    });
  }

  const form = new FormData();
  form.append("merchantId",     process.env.MERCHANT_ID);
  form.append("password",       process.env.PAYSTATION_PASSWORD);
  form.append("invoice_number", invoice_number);
  form.append("currency",       "BDT");
  form.append("payment_amount", String(total));
  form.append("reference",      invoice_number);
  form.append("cust_name",      name);
  form.append("cust_phone",     phone);
  form.append("cust_email",     email);
  form.append("cust_address",   full_address);
  form.append("callback_url",   callback_url);
  form.append("checkout_items", checkout_items);

  let psData;
  try {
    const psRes = await fetch(`${BASE}/initiate-payment`, {
      method: "POST",
      body: form,
    });

    const responseText = await psRes.text();
    try { psData = JSON.parse(responseText); }
    catch (parseErr) { psData = { status: "failed", message: responseText || "Invalid response" }; }
  } catch (err) {
    if (ordersCol) {
      await ordersCol.updateOne({ invoice_number }, { $set: { status: "failed", updated_at: new Date() } });
    }
    return res.status(500).json({ error: "Payment gateway network error — please try again" });
  }

  if (psData.status === "success" && psData.payment_url) {
    if (ordersCol) {
      await ordersCol.updateOne(
        { invoice_number },
        { $set: { status: "pending", payment_url: psData.payment_url, updated_at: new Date() } }
      );
    }
    return res.status(200).json({ payment_url: psData.payment_url, invoice_number });
  } else {
    if (ordersCol) {
      await ordersCol.updateOne(
        { invoice_number },
        { $set: { status: "failed", ps_error: psData.message || null, updated_at: new Date() } }
      );
    }
    return res.status(400).json({
      error: psData.message || "Payment initiation failed",
      raw: psData,
    });
  }
};