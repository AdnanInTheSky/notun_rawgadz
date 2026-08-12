process.env.PATHAO_BASE_URL = "https://courier-api-sandbox.pathao.com";
process.env.PATHAO_CLIENT_ID = "7N1aMJQbWm";
process.env.PATHAO_CLIENT_SECRET = "wRcaibZkUdSNz2EI9ZyuXLlNrnAv0TdPUPXMnD39";
process.env.PATHAO_USERNAME = "test@pathao.com";
process.env.PATHAO_PASSWORD = "lovePathao";

const { getPathaoToken, getPathaoStores } = require('../api/_pathao');

async function checkStores() {
  try {
    const stores = await getPathaoStores();
    console.log("Pathao Registered Stores Data:", JSON.stringify(stores.data.data, null, 2));
  } catch (err) {
    console.error("Store Check Error:", err);
  }
}

checkStores();
