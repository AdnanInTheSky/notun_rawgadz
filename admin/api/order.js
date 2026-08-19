// admin/api/order.js
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
