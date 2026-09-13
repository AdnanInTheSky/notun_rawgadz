// api/inventory.js
// Vercel Serverless Function — Provides live stock & availability from MongoDB Atlas
// Database: paystationdemo, Collection: inventory

const { getDb } = require("./_db");

function getAvailabilityState(stock) {
  if (typeof stock !== "number" || stock <= 0) return "out_of_stock";
  if (stock <= 5) return "low_stock";
  return "in_stock";
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const client = await getDb();
    const inventoryCol = client.db("paystationdemo").collection("inventory");

    // Handle POST request with a list of items or productIds
    if (req.method === "POST") {
      const body = req.body || {};
      const { items, productIds } = body;

      if (Array.isArray(productIds) && productIds.length > 0) {
        const cleanIds = productIds.map(String).filter(Boolean);
        const docs = await inventoryCol
          .find({ productId: { $in: cleanIds } }, { projection: { _id: 0, productId: 1, typeId: 1, subProductId: 1, stock: 1 } })
          .toArray();

        const formatted = docs.map(doc => ({
          productId: doc.productId,
          typeId: doc.typeId,
          subProductId: doc.subProductId ?? null,
          stock: typeof doc.stock === "number" ? doc.stock : 0,
          status: getAvailabilityState(doc.stock),
        }));

        return res.status(200).json({ success: true, inventory: formatted });
      }

      if (Array.isArray(items) && items.length > 0) {
        const orConditions = items.map(item => {
          const productId = String(item.productId || item.id || "").trim();
          const typeId = item.typeId !== undefined && item.typeId !== null ? String(item.typeId).trim() : undefined;
          const subProductId = (item.subProductId !== undefined && item.subProductId !== null && item.subProductId !== "null" && item.subProductId !== "")
            ? String(item.subProductId).trim()
            : null;

          const cond = { productId };
          if (typeId !== undefined) cond.typeId = typeId;
          cond.subProductId = subProductId;
          return cond;
        }).filter(c => !!c.productId);

        if (orConditions.length === 0) {
          return res.status(400).json({ success: false, error: "Invalid items specified." });
        }

        const docs = await inventoryCol
          .find({ $or: orConditions }, { projection: { _id: 0, productId: 1, typeId: 1, subProductId: 1, stock: 1 } })
          .toArray();

        const formatted = docs.map(doc => ({
          productId: doc.productId,
          typeId: doc.typeId,
          subProductId: doc.subProductId ?? null,
          stock: typeof doc.stock === "number" ? doc.stock : 0,
          status: getAvailabilityState(doc.stock),
        }));

        return res.status(200).json({ success: true, inventory: formatted });
      }

      return res.status(400).json({ success: false, error: "Must specify items or productIds in body." });
    }

    // Handle GET request
    const { productId, typeId, subProductId } = req.query || {};

    // Specific product/type/subProduct lookup
    if (productId && typeId !== undefined) {
      const cleanSubId = (subProductId === undefined || subProductId === null || subProductId === "null" || subProductId === "")
        ? null
        : String(subProductId).trim();

      const doc = await inventoryCol.findOne(
        {
          productId: String(productId).trim(),
          typeId: String(typeId).trim(),
          subProductId: cleanSubId,
        },
        { projection: { _id: 0, productId: 1, typeId: 1, subProductId: 1, stock: 1 } }
      );

      const stock = doc && typeof doc.stock === "number" ? doc.stock : 0;
      const status = getAvailabilityState(stock);

      return res.status(200).json({
        success: true,
        productId: String(productId).trim(),
        typeId: String(typeId).trim(),
        subProductId: cleanSubId,
        stock,
        inStock: stock > 0,
        status,
      });
    }

    // Lookup all items for a product ID
    if (productId) {
      const docs = await inventoryCol
        .find(
          { productId: String(productId).trim() },
          { projection: { _id: 0, productId: 1, typeId: 1, subProductId: 1, stock: 1 } }
        )
        .toArray();

      const formatted = docs.map(doc => ({
        productId: doc.productId,
        typeId: doc.typeId,
        subProductId: doc.subProductId ?? null,
        stock: typeof doc.stock === "number" ? doc.stock : 0,
        status: getAvailabilityState(doc.stock),
      }));

      return res.status(200).json({
        success: true,
        productId: String(productId).trim(),
        inventory: formatted,
      });
    }

    // Return all inventory if no parameters specified
    const docs = await inventoryCol
      .find({}, { projection: { _id: 0, productId: 1, typeId: 1, subProductId: 1, stock: 1 } })
      .toArray();

    const formatted = docs.map(doc => ({
      productId: doc.productId,
      typeId: doc.typeId,
      subProductId: doc.subProductId ?? null,
      stock: typeof doc.stock === "number" ? doc.stock : 0,
      status: getAvailabilityState(doc.stock),
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      inventory: formatted,
    });

  } catch (err) {
    console.error("[api/inventory] Internal Error:", err.message);
    // Never expose MongoDB credentials or database details to the client
    return res.status(500).json({
      success: false,
      error: "Unable to retrieve inventory information at this time.",
    });
  }
};
