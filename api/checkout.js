// api/checkout.js
// Serverless function entry point for /api/checkout

const initiateHandler = require("./initiate");

module.exports = async function handler(req, res) {
  return initiateHandler(req, res);
};
