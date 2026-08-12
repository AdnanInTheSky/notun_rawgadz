process.env.MONGO_URI = "mongodb+srv://ad:uhBQEAKXcKN6Z5be@cluster0.bd9ywas.mongodb.net/?retryWrites=true&w=majority";
const { getDb } = require('../api/_db');

async function freeQuota() {
  try {
    console.log("Connecting to MongoDB to drop sample_mflix and unblock writes...");
    const client = await getDb();
    
    // Drop sample_mflix database
    await client.db("sample_mflix").dropDatabase();
    console.log("SUCCESS: Dropped sample_mflix database. Freed ~168 MB!");

    // Now seed demo orders into paystationdemo.orders
    const db = client.db("paystationdemo");
    const ordersCol = db.collection("orders");

    const demoOrders = [
      {
        invoice_number: "INV-DEMO-COD-101",
        subtotal: 1499.00,
        delivery_charge: 0,
        discount_amount: 0,
        coupon_code: null,
        payment_amount: 1499.00,
        currency: "BDT",
        payment_method: "cod",
        status: "pending",
        trx_status: "cash_on_delivery",
        verified: true,
        courier_status: "pending",
        consignment_id: null,
        customer: {
          name: "Tanvir Hossain",
          phone: "01712345678",
          email: "tanvir@example.com",
          jela: "Dhaka",
          thana: "Gulshan",
          address_detail: "House 12, Road 5, Block B, Gulshan 1",
          full_address: "House 12, Road 5, Block B, Gulshan 1, Dhaka"
        },
        items: [
          { id: "p1", name: "Mechanical Wireless Keyboard", price: 1499.00, qty: 1, subtotal: 1499.00 }
        ],
        checkout_items: "Mechanical Wireless Keyboard x1",
        callback_url: "http://localhost:3000/api/callback",
        trx_id: "COD-INV-DEMO-COD-101",
        created_at: new Date(Date.now() - 3600000 * 2),
        updated_at: new Date(Date.now() - 3600000 * 2)
      },
      {
        invoice_number: "INV-DEMO-ONLINE-102",
        subtotal: 2999.00,
        delivery_charge: 0,
        discount_amount: 0,
        coupon_code: null,
        payment_amount: 2999.00,
        currency: "BDT",
        payment_method: "paystation",
        status: "success",
        trx_status: "success",
        verified: true,
        courier_status: "dispatched",
        consignment_id: "CP-849201928",
        customer: {
          name: "Sumi Akter",
          phone: "01898765432",
          email: "sumi@example.com",
          jela: "Dhaka",
          thana: "Dhanmondi",
          address_detail: "Flat 4B, House 88, Road 27, Dhanmondi",
          full_address: "Flat 4B, House 88, Road 27, Dhanmondi, Dhaka"
        },
        items: [
          { id: "p2", name: "Ergonomic Gaming Mouse", price: 2999.00, qty: 1, subtotal: 2999.00 }
        ],
        checkout_items: "Ergonomic Gaming Mouse x1",
        callback_url: "http://localhost:3000/api/callback",
        trx_id: "PS-TRX-994821",
        created_at: new Date(Date.now() - 3600000 * 5),
        updated_at: new Date(Date.now() - 3600000 * 5)
      },
      {
        invoice_number: "INV-DEMO-COD-103",
        subtotal: 2500.00,
        delivery_charge: 0,
        discount_amount: 250.00,
        coupon_code: "RAWGAD10",
        payment_amount: 2250.00,
        currency: "BDT",
        payment_method: "cod",
        status: "pending",
        trx_status: "cash_on_delivery",
        verified: true,
        courier_status: "pending",
        consignment_id: null,
        customer: {
          name: "Rahim Chowdhury",
          phone: "01911223344",
          email: "rahim@example.com",
          jela: "Dhaka",
          thana: "Uttara",
          address_detail: "Sector 4, Road 12, House 15, Uttara",
          full_address: "Sector 4, Road 12, House 15, Uttara, Dhaka"
        },
        items: [
          { id: "p3", name: "Ultra-Fast USB-C Hub 7-in-1", price: 2500.00, qty: 1, subtotal: 2500.00 }
        ],
        checkout_items: "Ultra-Fast USB-C Hub 7-in-1 x1",
        callback_url: "http://localhost:3000/api/callback",
        trx_id: "COD-INV-DEMO-COD-103",
        created_at: new Date(Date.now() - 3600000 * 1),
        updated_at: new Date(Date.now() - 3600000 * 1)
      }
    ];

    const result = await ordersCol.insertMany(demoOrders);
    console.log("SUCCESS: Inserted sample orders into paystationdemo.orders:", result.insertedCount);
    process.exit(0);
  } catch (err) {
    console.error("Free Quota & Seed Error:", err);
    process.exit(1);
  }
}

freeQuota();
