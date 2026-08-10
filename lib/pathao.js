// lib/pathao.js
// Pathao Courier Merchant API v1 Wrapper with Token Caching and Defensive Error Handling

const { getDb } = require("../api/_db");

const getBaseUrl = () => {
  const url = process.env.PATHAO_BASE_URL || "https://courier-api-sandbox.pathao.com";
  return url.replace(/\/$/, "");
};

/**
 * Requests or retrieves a cached Pathao Access Token.
 * Caches token in MongoDB collection `pathao_tokens` to handle serverless cold starts & avoid rate limits.
 */
async function getPathaoToken() {
  const baseUrl = getBaseUrl();
  const clientId = process.env.PATHAO_CLIENT_ID;
  const clientSecret = process.env.PATHAO_CLIENT_SECRET;
  const username = process.env.PATHAO_USERNAME;
  const password = process.env.PATHAO_PASSWORD;

  if (!clientId || !clientSecret || !username || !password) {
    throw new Error("Missing Pathao environment credentials (PATHAO_CLIENT_ID, PATHAO_CLIENT_SECRET, PATHAO_USERNAME, PATHAO_PASSWORD)");
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
    // If DB fails, proceed to request fresh token
  }

  // Request new token from Pathao
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
    const errMsg = data.message || data.error_description || data.error || "Failed to obtain Pathao access token";
    throw new Error(`Pathao Auth Error (${tokenRes.status}): ${errMsg}`);
  }

  // Cache token in DB if collection is available
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
      // Non-fatal if caching fails
    }
  }

  return data.access_token;
}

/**
 * Generic fetch wrapper for Pathao API endpoints.
 * Automatically injects Bearer Token and handles JSON parsing defenses.
 */
async function pathaoRequest(endpoint, options = {}) {
  const baseUrl = getBaseUrl();
  const token = await getPathaoToken();

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...(options.headers || {})
  };

  const fetchOptions = {
    ...options,
    headers
  };

  const response = await fetch(url, fetchOptions);
  const responseText = await response.text();

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (parseErr) {
    throw new Error(`Pathao API Gateway Error (${response.status}): ${responseText.slice(0, 200)}`);
  }

  if (!response.ok) {
    const errorDetail = data.message || data.error || (data.errors ? JSON.stringify(data.errors) : `HTTP ${response.status}`);
    throw new Error(`Pathao API Error (${response.status}): ${errorDetail}`);
  }

  return data;
}

module.exports = {
  getPathaoToken,
  pathaoRequest
};
