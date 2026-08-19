const fs = require('fs');
const path = require('path');

// Ensure directories
fs.mkdirSync('admin/api/admin', { recursive: true });
fs.mkdirSync('admin/components/admin', { recursive: true });
fs.mkdirSync('admin/components/navbar', { recursive: true });
fs.mkdirSync('admin/components/footer', { recursive: true });
fs.mkdirSync('admin/components/utilities', { recursive: true });

// 1. Copy dependencies
fs.copyFileSync('components/utilities/tailwind.js', 'admin/components/utilities/tailwind.js');
fs.copyFileSync('components/navbar/my-navbar.js', 'admin/components/navbar/my-navbar.js');
fs.copyFileSync('components/footer/my-footer.js', 'admin/components/footer/my-footer.js');

const adminCompFiles = fs.readdirSync('components/admin');
for (const f of adminCompFiles) {
  fs.copyFileSync(path.join('components/admin', f), path.join('admin/components/admin', f));
}

// 2. admin/api/_db.js
const dbContent = `// admin/api/_db.js
const { MongoClient } = require("mongodb");

const URI = process.env.MONGO_URI;
if (!URI) {
  console.error("[DB] CRITICAL: MONGO_URI is missing");
}

let clientPromise = null;

async function getDb() {
  if (global._mongoClient) return global._mongoClient;
  if (clientPromise) return clientPromise;
  if (!URI) throw new Error("MONGO_URI is not defined");

  const client = new MongoClient(URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 15000,
    connectTimeoutMS: 10000,
  });

  clientPromise = client.connect()
    .then((connectedClient) => {
      global._mongoClient = connectedClient;
      return connectedClient.db("admin").command({ ping: 1 })
        .then(() => connectedClient);
    })
    .catch((err) => {
      clientPromise = null;
      throw err;
    });

  return clientPromise;
}

module.exports = { getDb };
`;
fs.writeFileSync('admin/api/_db.js', dbContent);

// 3. admin/api/_pathao.js
fs.copyFileSync('api/_pathao.js', 'admin/api/_pathao.js');

// 4. admin/api/order.js
const orderContent = `// admin/api/order.js
// GET /api/order — Serverless handler to fetch all store orders from MongoDB for Admin

const { getDb } = require("./_db");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const client = await getDb();
    const ordersCol = client.db("paystationdemo").collection("orders");

    // Fetch all orders sorted by creation date descending
    const orders = await ordersCol.find({}).sort({ created_at: -1 }).toArray();

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders: orders
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to fetch orders from database",
      details: err.message
    });
  }
};
`;
fs.writeFileSync('admin/api/order.js', orderContent);

// 5. admin/api/pathao.js
const pathaoContent = `// admin/api/pathao.js
// POST /api/pathao — Dispatch order to Pathao Courier Merchant API v1

const { getDb } = require("./_db");
const { pathaoRequest } = require("./_pathao");

function formatBDPhone(rawPhone) {
  if (!rawPhone) return "";
  let digits = rawPhone.toString().replace(/[^\\d]/g, "");
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
    if (!/^01[3-9]\\d{8}$/.test(phone)) {
      throw new Error(\`Invalid recipient phone number '\${customer.phone}'. Must be a valid 11-digit Bangladeshi mobile number (e.g. 01712345678).\`);
    }

    // Format & validate address (Pathao requires minimum 10 characters)
    let fullAddress = (customer.full_address || customer.address_detail || "").trim();
    if (fullAddress.length < 10) {
      fullAddress = \`\${fullAddress}, Bangladesh (Verified Order)\`.slice(0, 300);
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
`;
fs.writeFileSync('admin/api/pathao.js', pathaoContent);

// 6. admin/api/pathao-locations.js
fs.copyFileSync('api/pathao-locations.js', 'admin/api/pathao-locations.js');

// 7. admin/api/pathao-webhook.js
fs.copyFileSync('api/pathao-webhook.js', 'admin/api/pathao-webhook.js');

// 8. admin/api/admin/pathao.js & _pathao.js
fs.writeFileSync('admin/api/admin/pathao.js', 'module.exports = require("../pathao");\n');
fs.writeFileSync('admin/api/admin/_pathao.js', 'module.exports = require("../_pathao");\n');

// 9. admin/package.json
const adminPkg = {
  name: "rawgadz-admin",
  version: "1.0.0",
  private: true,
  description: "Rawgad Admin Dashboard & Pathao Courier Integration",
  dependencies: {
    mongodb: "^6.3.0"
  }
};
fs.writeFileSync('admin/package.json', JSON.stringify(adminPkg, null, 2) + '\n');

// 10. admin/admin.html and admin/index.html
const adminHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard - Rawgad Orders & Dispatch</title>
  
  <script src="https://cdn.tailwindcss.com"></script>
  
  <script type="module" src="./components/utilities/tailwind.js"></script>
  <script type="module" src="./components/navbar/my-navbar.js"></script>
  <script type="module" src="./components/footer/my-footer.js"></script>

  <!-- Admin Components -->
  <script type="module" src="./components/admin/admin-dashboard.js"></script>
</head>
<body class="bg-neutral-50 min-h-screen flex flex-col font-sans text-neutral-900 selection:bg-black selection:text-white">

  <!-- Navbar -->
  <my-navbar>
    <div class="flex gap-6 items-center flex-grow">
      <a href="../index.html" class="hover:text-black transition-colors font-semibold text-xs tracking-wider uppercase text-neutral-600">Home</a>
      <a href="../index.html#shop" class="hover:text-black transition-colors font-semibold text-xs tracking-wider uppercase text-neutral-600">Shop</a>
      <a href="../blog.html" class="hover:text-black transition-colors font-semibold text-xs tracking-wider uppercase text-neutral-600">Blog</a>
      <a href="./index.html" class="hover:text-black transition-colors font-bold text-xs tracking-wider uppercase text-black border-b-2 border-black pb-0.5">Admin</a>
    </div>
  </my-navbar>

  <!-- Main Container -->
  <main class="p-4 md:p-6 flex flex-col w-full max-w-7xl mx-auto flex-grow gap-4">
    <admin-dashboard></admin-dashboard>
  </main>

  <!-- Footer -->
  <my-footer>
    <div slot="description">
      <h3 class="text-xs font-bold text-white uppercase tracking-widest mb-2">Rawgad Admin</h3>
      <p class="text-xs text-neutral-400 leading-relaxed">
        Internal Order Processing & Courier Integration Dashboard.
      </p>
    </div>
  </my-footer>

</body>
</html>
`;

fs.writeFileSync('admin/index.html', adminHtmlContent);
fs.writeFileSync('admin/admin.html', adminHtmlContent);

// 11. Root admin.html redirect or forward to ./admin/
const rootAdminRedirect = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=./admin/index.html">
  <title>Redirecting to Admin...</title>
  <script>window.location.href = "./admin/index.html";</script>
</head>
<body class="bg-neutral-50 flex items-center justify-center min-h-screen font-sans">
  <p class="text-xs font-bold uppercase tracking-wider text-neutral-500">Redirecting to Admin Dashboard...</p>
</body>
</html>
`;
fs.writeFileSync('admin.html', rootAdminRedirect);

console.log('Successfully configured admin/ folder with standalone API and frontend');

