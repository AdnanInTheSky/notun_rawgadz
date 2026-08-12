process.env.MONGO_URI = "mongodb+srv://ad:uhBQEAKXcKN6Z5be@cluster0.bd9ywas.mongodb.net/?retryWrites=true&w=majority";
const { getDb } = require('../api/_db');

async function inspect() {
  try {
    console.log("Connecting to MongoDB cluster...");
    const client = await getDb();
    const adminDb = client.db().admin();
    const dbsList = await adminDb.listDatabases();
    console.log("Databases in Cluster:");
    for (const dbInfo of dbsList.databases) {
      console.log(` - ${dbInfo.name} (${(dbInfo.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
      const db = client.db(dbInfo.name);
      try {
        const collections = await db.listCollections().toArray();
        for (const col of collections) {
          try {
            const count = await db.collection(col.name).estimatedDocumentCount();
            console.log(`    └─ ${col.name}: ${count} docs`);
          } catch (e) {
            console.log(`    └─ ${col.name}: [err reading count]`);
          }
        }
      } catch (e) {}
    }
    process.exit(0);
  } catch (err) {
    console.error("Cluster Inspect Error:", err);
    process.exit(1);
  }
}

inspect();
