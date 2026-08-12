// api/pathao.js
// Serverless function entry point for /api/pathao

const pathaoDispatchHandler = require("./admin/pathao");

module.exports = async function handler(req, res) {
  return pathaoDispatchHandler(req, res);
};
