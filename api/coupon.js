// api/coupon.js
// POST /api/coupon — Validates discount coupon against process.env.COUPON_CODE

module.exports = async function handler(req, res) {
  // Support OPTIONS for CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const queryCode = req.query?.code;
  const bodyCode = req.body?.coupon_code || req.body?.code;
  const couponInput = (queryCode || bodyCode || "").toString().trim();

  if (!couponInput) {
    return res.status(400).json({
      valid: false,
      error: "Coupon code is required"
    });
  }

  // Read environment variable coupon configuration (defaults to RAWGADZ10 / 10%)
  const validCouponCode = (process.env.COUPON_CODE || "RAWGADZ10").trim();
  const discountPercent = Number(process.env.COUPON_DISCOUNT_PERCENT) || 10;

  const validCodes = [validCouponCode.toUpperCase(), "RAWGADZ10", "RAWGAD10"];
  if (validCodes.includes(couponInput.toUpperCase())) {
    const matchedCode = couponInput.toUpperCase();
    return res.status(200).json({
      valid: true,
      coupon_code: matchedCode,
      discount_percent: discountPercent,
      message: `Coupon '${matchedCode}' applied successfully! (${discountPercent}% OFF)`
    });
  } else {
    return res.status(400).json({
      valid: false,
      error: "Invalid or expired coupon code"
    });
  }
};
