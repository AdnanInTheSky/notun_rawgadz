// api/_db.js
const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

function loadEnvFallback() {
  if (process.env.MONGO_URI) return;
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const idx = trimmed.indexOf("=");
          const k = trimmed.slice(0, idx).trim();
          const v = trimmed.slice(idx + 1).trim();
          if (!process.env[k]) {
            process.env[k] = v;
          }
        }
      }
    }
  } catch (_) {}
}

let clientPromise = null;
let indexEnsured = false;

async function ensureIndexes(client) {
  if (indexEnsured) return;
  try {
    const db = client.db("paystationdemo");
    await db.collection("inventory").createIndex(
      { productId: 1, typeId: 1, subProductId: 1 },
      { unique: true }
    );
    indexEnsured = true;
  } catch (err) {
    console.warn("[DB] Note: Could not ensure inventory index:", err.message);
  }
}

async function getDb() {
  loadEnvFallback();
  const URI = process.env.MONGO_URI;

  if (global._mongoClient) {
    ensureIndexes(global._mongoClient).catch(() => {});
    return global._mongoClient;
  }
  if (clientPromise) return clientPromise;
  if (!URI) throw new Error("MONGO_URI is not defined");

  const client = new MongoClient(URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 15000,
    connectTimeoutMS: 10000,
  });

  clientPromise = client.connect()
    .then(async (connectedClient) => {
      global._mongoClient = connectedClient;
      await connectedClient.db("admin").command({ ping: 1 });
      await ensureIndexes(connectedClient);
      return connectedClient;
    })
    .catch((err) => {
      clientPromise = null;
      throw err;
    });

  return clientPromise;
}

module.exports = { getDb };