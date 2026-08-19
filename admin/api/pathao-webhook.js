// api/pathao-webhook.js
// POST /api/pathao-webhook — Serverless webhook listener for Pathao Courier status events

const { getDb } = require("./_db");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = req.body || {};
  const consignment_id = payload.consignment_id || payload.consignment_number || payload.data?.consignment_id;
  const merchant_order_id = payload.merchant_order_id || payload.invoice_number || payload.data?.merchant_order_id;
  const eventStatus = payload.order_status || payload.event || payload.status || payload.data?.order_status || "updated";

  if (!consignment_id && !merchant_order_id) {
    return res.status(400).json({ error: "Missing consignment_id or merchant_order_id in webhook payload" });
  }

  try {
    const client = await getDb();
    const ordersCol = client.db("paystationdemo").collection("orders");

    const query = consignment_id 
      ? { $or: [{ consignment_id }, { "courier.consignment_id": consignment_id }] }
      : { invoice_number: merchant_order_id };

    const updateDoc = {
      $set: {
        courier_status: eventStatus,
        "courier.pathaoStatus": eventStatus,
        "courier.lastWebhookAt": new Date(),
        updated_at: new Date()
      },
      $push: {
        courier_events: {
          event: eventStatus,
          payload: payload,
          received_at: new Date()
        }
      }
    };

    // If order delivered, mark verified / payment status if COD
    if (["delivered", "order.delivered", "order_delivered"].includes(eventStatus.toLowerCase())) {
      updateDoc.$set.status = "success";
      updateDoc.$set.verified = true;
    }

    await ordersCol.updateOne(query, updateDoc);

    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully"
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to process Pathao webhook",
      details: err.message
    });
  }
};
