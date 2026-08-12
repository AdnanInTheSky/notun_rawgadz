process.env.MONGO_URI = "mongodb+srv://ad:uhBQEAKXcKN6Z5be@cluster0.bd9ywas.mongodb.net/?retryWrites=true&w=majority";
const { getDb } = require('../api/_db');

async function test() {
  try {
    console.log("Connecting to MongoDB URI...");
    const client = await getDb();
    const db = client.db("paystationdemo");
    const collections = await db.listCollections().toArray();
    console.log("Collections in paystationdemo:", collections.map(c => c.name));

    const ordersCol = db.collection("orders");
    const count = await ordersCol.countDocuments();
    console.log("Total orders in DB:", count);

    if (count > 0) {
      const sample = await ordersCol.find({}).limit(5).toArray();
      console.log("Sample orders:", JSON.stringify(sample, null, 2));
    }
    process.exit(0);
  } catch (err) {
    console.error("DB Test Error:", err);
    process.exit(1);
  }
}

test();
