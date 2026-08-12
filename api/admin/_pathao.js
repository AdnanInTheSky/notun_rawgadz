// api/admin/_pathao.js
// Pathao Courier Merchant API v1 Client Wrapper

const { getDb } = require("../_db");

const getBaseUrl = () => {
  const url = process.env.PATHAO_BASE_URL || "https://courier-api-sandbox.pathao.com";
  return url.replace(/\/$/, "");
};

let inFlightTokenPromise = null;

/**
 * Requests or retrieves a cached Pathao Access Token.
 * Caches token in MongoDB collection `pathao_tokens` with conservative 5-minute safety buffer.
 * Shares in-flight authentication promises to prevent token storms.
 */
async function getPathaoToken() {
  if (inFlightTokenPromise) {
    return inFlightTokenPromise;
  }

  inFlightTokenPromise = (async () => {
    try {
      const baseUrl = getBaseUrl();
      const clientId = process.env.PATHAO_CLIENT_ID;
      const clientSecret = process.env.PATHAO_CLIENT_SECRET;
      const username = process.env.PATHAO_USERNAME;
      const password = process.env.PATHAO_PASSWORD;

      if (!clientId || !clientSecret || !username || !password) {
        throw new Error("Missing Pathao credentials in environment variables (PATHAO_CLIENT_ID, PATHAO_CLIENT_SECRET, PATHAO_USERNAME, PATHAO_PASSWORD)");
      }

      let tokensCol = null;
      try {
        const client = await getDb();
        tokensCol = client.db("paystationdemo").collection("pathao_tokens");

        // Check DB for existing valid token (with 5 min safety buffer)
        const now = new Date();
        const existing = await tokensCol.findOne({
          _id: "current_pathao_token",
          expires_at: { $gt: new Date(now.getTime() + 5 * 60 * 1000) }
        });

        if (existing && existing.access_token) {
          return existing.access_token;
        }
      } catch (dbErr) {
        // If DB cache check fails, proceed to fetch a fresh token
      }

      // Request new token from Pathao API
      const authPayload = {
        client_id: clientId,
        client_secret: clientSecret,
        username: username,
        password: password,
        grant_type: "password"
      };

      const tokenRes = await fetch(`${baseUrl}/aladdin/api/v1/issue-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(authPayload)
      });

      const responseText = await tokenRes.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        throw new Error(`Pathao Auth Token Gateway Error (${tokenRes.status}): ${responseText.slice(0, 200)}`);
      }

      if (!tokenRes.ok || !data.access_token) {
        const errMsg = data.message || data.error_description || data.error || (data.errors ? JSON.stringify(data.errors) : "Failed to obtain Pathao access token");
        throw new Error(`Pathao Auth Error (${tokenRes.status}): ${errMsg}`);
      }

      // Cache token in DB
      if (tokensCol) {
        try {
          const expiresInSeconds = parseInt(data.expires_in, 10) || 86400; // Default 24h
          const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

          await tokensCol.updateOne(
            { _id: "current_pathao_token" },
            {
              $set: {
                access_token: data.access_token,
                refresh_token: data.refresh_token || null,
                expires_at: expiresAt,
                updated_at: new Date()
              }
            },
            { upsert: true }
          );
        } catch (cacheErr) {
          // Non-fatal if DB cache update fails
        }
      }

      return data.access_token;
    } finally {
      inFlightTokenPromise = null;
    }
  })();

  return inFlightTokenPromise;
}

/**
 * Generic fetch wrapper for Pathao API endpoints with timeout and defensive JSON parsing.
 */
async function pathaoRequest(endpoint, options = {}) {
  const baseUrl = getBaseUrl();
  const token = await getPathaoToken();

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 15000);

  try {
    const headers = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(options.headers || {})
    };

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      data = { raw: responseText };
    }

    if (!response.ok) {
      const errorDetail = data.message || data.error || (data.errors ? JSON.stringify(data.errors) : `HTTP ${response.status}`);
      const err = new Error(`Pathao API Error (${response.status}): ${errorDetail}`);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Helper: Fetch Pathao Merchant Stores
 */
async function getPathaoStores() {
  return pathaoRequest("/aladdin/api/v1/stores");
}

/**
 * Helper: Fetch Pathao Cities List
 */
async function getPathaoCities() {
  return pathaoRequest("/aladdin/api/v1/countries/1/city-list");
}

/**
 * Helper: Fetch Pathao Zones List for a given City ID
 */
async function getPathaoZones(cityId) {
  return pathaoRequest(`/aladdin/api/v1/cities/${cityId}/zone-list`);
}

/**
 * Helper: Fetch Pathao Areas List for a given Zone ID
 */
async function getPathaoAreas(zoneId) {
  return pathaoRequest(`/aladdin/api/v1/zones/${zoneId}/area-list`);
}

module.exports = {
  getPathaoToken,
  pathaoRequest,
  getPathaoStores,
  getPathaoCities,
  getPathaoZones,
  getPathaoAreas
};
