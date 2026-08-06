// api/callback.js
// GET /api/callback — Production grade, zero logging

const { getDb } = require("./_db");

const BASE = process.env.PAYSTATION_ENV === "live"
  ? "https://api.paystation.com.bd"
  : "https://sandbox.paystation.com.bd";

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).send("Method not allowed");
  }

  const { status, invoice_number, trx_id, txn_id } = req.query || {};

  if (!invoice_number) {
    return res.redirect(302, "/fail");
  }

  let ordersCol = null;
  try {
    const client = await getDb();
    // Updated DB name to match your connection string
    ordersCol = client.db("paystationdemo").collection("orders");
  } catch (err) {
    // Continue without DB
  }

  const lowerStatus = (status || "").toLowerCase();

  if (["failed", "canceled", "cancelled", "failure"].includes(lowerStatus)) {
    if (ordersCol) {
      await ordersCol.updateOne(
        { invoice_number },
        { $set: { status: "failed", trx_status: lowerStatus, verified: true, updated_at: new Date() } }
      );
    }
    return res.redirect(302, "/fail");
  }

  if (["successful", "success"].includes(lowerStatus)) {
    try {
      const psRes = await fetch(`${BASE}/transaction-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "merchantId": process.env.MERCHANT_ID,
        },
        body: JSON.stringify({ invoice_number }),
      });

      const psData = await psRes.json();
      const trxStatus = psData?.data?.trx_status?.toLowerCase();
      const isSuccess = trxStatus && ["success", "successful"].includes(trxStatus);
      const verifiedTrxId = psData?.data?.trx_id;
      const paymentAmount = psData?.data?.payment_amount;

      if (!isSuccess) {
        if (ordersCol) {
          await ordersCol.updateOne(
            { invoice_number },
            { $set: { status: "failed", trx_status: trxStatus, verified: true, updated_at: new Date() } }
          );
        }
        return res.redirect(302, "/fail");
      }

      if (ordersCol) {
        await ordersCol.updateOne(
          { invoice_number },
          {
            $set: {
              status: "success", trx_status: trxStatus,
              trx_id: verifiedTrxId || trx_id || txn_id,
              payment_amount: paymentAmount,
              verified: true, updated_at: new Date(),
            },
          }
        );
      }
      return res.redirect(302, `/thank?invoice_number=${encodeURIComponent(invoice_number)}`);

    } catch (err) {
      if (ordersCol) {
        await ordersCol.updateOne(
          { invoice_number },
          { $set: { status: "pending_verification", updated_at: new Date() } }
        );
      }
      return res.redirect(302, "/fail");
    }
  }

  return res.redirect(302, "/fail");
};