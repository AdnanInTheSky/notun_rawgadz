// scratch/test-cache-system.js
const assert = require('assert');

async function testInventoryHeaders() {
  console.log('--- TEST 1: Verifying Vercel Edge Caching Headers ---');
  const handler = require('../api/inventory');

  // Test GET request
  let getHeaders = {};
  let getStatusCode = null;
  let getResponseData = null;

  const getReq = { method: 'GET', query: {} };
  const getRes = {
    setHeader: (k, v) => { getHeaders[k.toLowerCase()] = v; },
    status: (code) => ({
      json: (data) => {
        getStatusCode = code;
        getResponseData = data;
      }
    }),
    end: () => {}
  };

  await handler(getReq, getRes);

  console.log('GET Status:', getStatusCode);
  console.log('GET Cache-Control:', getHeaders['cache-control']);
  console.log('GET CDN-Cache-Control:', getHeaders['cdn-cache-control']);
  console.log('GET Vercel-CDN-Cache-Control:', getHeaders['vercel-cdn-cache-control']);

  assert.strictEqual(getStatusCode, 200, 'GET should return 200');
  assert(getHeaders['cache-control'].includes('s-maxage=86400'), 'Cache-Control must contain s-maxage=86400 for Vercel');
  assert(getHeaders['cache-control'].includes('stale-while-revalidate=86400'), 'Cache-Control must contain stale-while-revalidate=86400');
  assert(getHeaders['cdn-cache-control'].includes('s-maxage=86400'), 'CDN-Cache-Control must contain s-maxage=86400');
  assert(getHeaders['vercel-cdn-cache-control'].includes('s-maxage=86400'), 'Vercel-CDN-Cache-Control must contain s-maxage=86400');
  assert(getResponseData && getResponseData.success === true, 'Response must be success: true');
  assert(Array.isArray(getResponseData.inventory), 'Response inventory must be an array');
  console.log(`PASS: GET returns 200 with ${getResponseData.inventory.length} inventory docs and correct 24h Vercel Edge headers.`);

  // Test POST request (checkout validation)
  let postHeaders = {};
  const postReq = {
    method: 'POST',
    body: { items: [{ productId: 'prod_001', typeId: 'prod_001_type_001', subProductId: 'prod_001_type_001_sub_001' }] }
  };
  const postRes = {
    setHeader: (k, v) => { postHeaders[k.toLowerCase()] = v; },
    status: (code) => ({ json: (data) => {} }),
    end: () => {}
  };

  await handler(postReq, postRes);
  assert(postHeaders['cache-control'].includes('no-store'), 'POST requests must have Cache-Control: no-store');
  console.log('PASS: POST requests properly have Cache-Control: no-store.');
}

async function testClientStockStorage() {
  console.log('\n--- TEST 2: Verifying Client-Side 24-Hour localStorage Cache Logic ---');
  
  // Create mock localStorage and window
  const storage = {};
  const localStorageMock = {
    getItem: (k) => storage[k] || null,
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: (k) => { delete storage[k]; }
  };

  const windowMock = {
    localStorage: localStorageMock,
    addEventListener: () => {},
    dispatchEvent: () => {}
  };

  // Mock sample inventory
  const mockInventory = [
    { productId: 'prod_001', typeId: 'prod_001_type_001', subProductId: 'prod_001_type_001_sub_001', stock: 15, status: 'in_stock' },
    { productId: 'prod_001', typeId: 'prod_001_type_001', subProductId: 'prod_001_type_001_sub_002', stock: 3, status: 'low_stock' },
    { productId: 'prod_001', typeId: 'prod_001_type_002', subProductId: null, stock: 0, status: 'out_of_stock' },
    { productId: 'prod_standalone', typeId: null, subProductId: null, stock: 42, status: 'in_stock' }
  ];

  // Mock global fetch returning all stock at once
  let fetchCallCount = 0;
  global.fetch = async (url) => {
    fetchCallCount++;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        count: mockInventory.length,
        inventory: mockInventory
      })
    };
  };

  // Run stock.js simulation in mock environment
  const fs = require('fs');
  const path = require('path');
  const stockCode = fs.readFileSync(path.join(__dirname, '..', 'stock.js'), 'utf8');

  const vm = require('vm');
  const context = {
    window: windowMock,
    localStorage: localStorageMock,
    console: console,
    Date: Date,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    fetch: global.fetch
  };
  vm.createContext(context);
  vm.runInContext(stockCode, context);

  const RawgadStock = context.window.RawgadStock;
  assert(RawgadStock, 'RawgadStock must be defined on window');

  // 1. Initial call should fetch and store in localStorage
  await RawgadStock.fetchAndStoreAllStock();
  assert.strictEqual(fetchCallCount, 1, 'Initial call should fetch from /api/inventory once');

  // Verify stored format
  const rawStored = localStorageMock.getItem(RawgadStock.STORAGE_KEY);
  assert(rawStored, 'localStorage should contain rawgad_inventory_stock');
  const parsed = JSON.parse(rawStored);
  assert(parsed.timestamp > 0, 'Cache must have a timestamp');
  assert.strictEqual(parsed.inventory.length, 4, 'Cache must store all 4 items');
  console.log('PASS: Initial sync pulled all stock at once and stored in localStorage.');

  // 2. Subsequent call within 24 hours should NOT fetch again (uses localStorage cache)
  const cachedStock = await RawgadStock.fetchAndStoreAllStock();
  assert.strictEqual(fetchCallCount, 1, 'Should NOT make a network call when cache is valid');
  assert.strictEqual(RawgadStock.isCacheValid(), true, 'isCacheValid() must return true');
  console.log('PASS: Within 24 hours, stock data is served from localStorage with 0 network calls.');

  // 3. Verify stock lookups
  const stockSub1 = RawgadStock.getItemStock('prod_001', 'prod_001_type_001', 'prod_001_type_001_sub_001');
  assert.strictEqual(stockSub1, 15, 'Should return stock 15 for subproduct 1');

  const stockSub2 = RawgadStock.getItemStock('prod_001', 'prod_001_type_001', 'prod_001_type_001_sub_002');
  assert.strictEqual(stockSub2, 3, 'Should return stock 3 for subproduct 2');

  const stockType2 = RawgadStock.getItemStock('prod_001', 'prod_001_type_002', null);
  assert.strictEqual(stockType2, 0, 'Should return stock 0 for type 2');

  const stockStandalone = RawgadStock.getItemStock('prod_standalone', null, null);
  assert.strictEqual(stockStandalone, 42, 'Should return stock 42 for standalone product');

  const prodMap = RawgadStock.getProductStockMap('prod_001');
  assert.strictEqual(prodMap['prod_001_type_001:::prod_001_type_001_sub_001'], 15);
  assert.strictEqual(prodMap['prod_001_type_001:::prod_001_type_001_sub_002'], 3);
  assert.strictEqual(prodMap['prod_001_type_002:::null'], 0);
  console.log('PASS: Fast lookups via getItemStock and getProductStockMap return correct counts.');

  // 4. Expiration after 24 hours
  console.log('\n--- TEST 3: Verifying 24-Hour Expiration & Automatic Refresh ---');
  // Age timestamp by 25 hours in localStorage
  parsed.timestamp = Date.now() - (25 * 60 * 60 * 1000);
  localStorageMock.setItem(RawgadStock.STORAGE_KEY, JSON.stringify(parsed));

  // Simulate opening the website 25 hours later (new page context)
  const context2 = {
    window: { localStorage: localStorageMock, addEventListener: () => {}, dispatchEvent: () => {} },
    localStorage: localStorageMock,
    console: console,
    Date: Date,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    fetch: global.fetch
  };
  vm.createContext(context2);
  vm.runInContext(stockCode, context2);

  const RawgadStockReloaded = context2.window.RawgadStock;
  // Expired cache must trigger a fresh pull of all stock data
  await RawgadStockReloaded.fetchAndStoreAllStock(false);
  assert.strictEqual(fetchCallCount, 2, 'Expired 24h cache must trigger a fresh pull of all stock data');
  console.log('PASS: Expired cache (>24 hours) automatically triggered a fresh pull and updated localStorage.');
}

async function runAll() {
  try {
    await testInventoryHeaders();
    await testClientStockStorage();
    console.log('\n=============================================');
    console.log('ALL TESTS PASSED SUCCESSFULLY!');
    console.log('=============================================');
  } catch (e) {
    console.error('TEST FAILED:', e);
    process.exit(1);
  }
}

runAll();
