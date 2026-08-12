process.env.MONGO_URI = "mongodb+srv://ad:uhBQEAKXcKN6Z5be@cluster0.bd9ywas.mongodb.net/?retryWrites=true&w=majority";
const orderHandler = require('../api/order');

async function testApi() {
  const req = { method: 'GET' };
  const res = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      console.log(`HTTP ${this.statusCode} Response:`, JSON.stringify(obj, null, 2));
    }
  };

  await orderHandler(req, res);
}

testApi();
