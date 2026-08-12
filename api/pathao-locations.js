// api/pathao-locations.js
// GET /api/pathao-locations — Serverless endpoint to fetch stores, cities, zones, and areas

const { getPathaoStores, getPathaoCities, getPathaoZones, getPathaoAreas } = require("./_pathao");

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { type, city_id, zone_id } = req.query || {};

  try {
    if (type === "stores") {
      const stores = await getPathaoStores();
      return res.status(200).json({ success: true, data: stores });
    }

    if (type === "cities") {
      const cities = await getPathaoCities();
      return res.status(200).json({ success: true, data: cities });
    }

    if (type === "zones") {
      if (!city_id) {
        return res.status(400).json({ error: "city_id is required to fetch zones" });
      }
      const zones = await getPathaoZones(city_id);
      return res.status(200).json({ success: true, data: zones });
    }

    if (type === "areas") {
      if (!zone_id) {
        return res.status(400).json({ error: "zone_id is required to fetch areas" });
      }
      const areas = await getPathaoAreas(zone_id);
      return res.status(200).json({ success: true, data: areas });
    }

    return res.status(400).json({
      error: "Invalid type specified. Valid values: stores, cities, zones, areas"
    });
  } catch (err) {
    const statusCode = err.status || 500;
    return res.status(statusCode).json({
      error: err.message || "Failed to fetch Pathao location data",
      details: err.data || null
    });
  }
};
