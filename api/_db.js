// api/_db.js
const { MongoClient } = require("mongodb");

const URI = process.env.MONGO_URI;
if (!URI) {
  console.error("[DB] CRITICAL: MONGO_URI is missing");
}

let clientPromise = null;

async function getDb() {
  if (global._mongoClient) return global._mongoClient;
  if (clientPromise) return clientPromise;
  if (!URI) throw new Error("MONGO_URI is not defined");

  const client = new MongoClient(URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 15000,
    connectTimeoutMS: 10000,
  });

  clientPromise = client.connect()
    .then((connectedClient) => {
      global._mongoClient = connectedClient;
      return connectedClient.db("admin").command({ ping: 1 })
        .then(() => connectedClient);
    })
    .catch((err) => {
      clientPromise = null;
      throw err;
    });

  return clientPromise;
}

module.exports = { getDb };