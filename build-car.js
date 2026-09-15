const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

// Input and Output Directory Paths
const CONTENT_DIR = path.join(__dirname, 'content', 'cars');
const ROOT_OUTPUT_FILE = path.join(__dirname, 'cars.json');
const PUBLIC_OUTPUT_FILE = path.join(__dirname, 'public', 'cars.json');

/**
 * Normalizes a car variant/subproduct and recursively parses nested subproducts
 */
function normalizeSubProduct(sub) {
  if (!sub || typeof sub !== 'object') return null;

  const rawNested = Array.isArray(sub.subProducts)
    ? sub.subProducts
    : (Array.isArray(sub.subproducts)
      ? sub.subproducts
      : (Array.isArray(sub.types) ? sub.types : []));

  const subProducts = rawNested.map(item => {
    if (!item || typeof item !== 'object') return null;
    const nestedItem = {
      subProductId: String(item.subProductId || item.id || '').trim(),
      subImage: item.subImage || item.imageSrc || item.image || '',
      subTitle: item.subTitle || item.title || ''
    };
    if (item.price !== undefined && item.price !== null && item.price !== '') {
      nestedItem.price = Number(item.price) || 0;
    }
    return nestedItem;
  }).filter(Boolean);

  const normalized = {
    subProductId: String(sub.subProductId || sub.id || '').trim(),
    subImage: sub.subImage || sub.imageSrc || sub.image || '',
    subTitle: sub.subTitle || sub.title || ''
  };

  if (sub.price !== undefined && sub.price !== null && sub.price !== '') {
    normalized.price = Number(sub.price) || 0;
  }

  if (subProducts.length > 0) {
    normalized.subProducts = subProducts;
  }

  return normalized;
}

/**
 * Compiles content/cars/*.md to cars.json and public/cars.json
 */
function generateCarsJson() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.warn(`[build-car] Creating missing directory: ${CONTENT_DIR}`);
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  }

  const files = fs.readdirSync(CONTENT_DIR).filter(file => file.endsWith('.md'));
  if (files.length === 0) {
    console.warn(`[build-car] Warning: No .md files found in ${CONTENT_DIR}`);
  }

  const cars = [];

  for (const file of files) {
    const filePath = path.join(CONTENT_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Parse YAML frontmatter and markdown body
    const { data, content } = matter(fileContent);

    if (!data.id || !data.title) {
      console.warn(`[build-car] Warning: Skipping ${file}. Missing required 'id' or 'title' in frontmatter.`);
      continue;
    }

    const htmlContent = marked.parse(content || '');

    const rawTypes = Array.isArray(data.types)
      ? data.types
      : (Array.isArray(data.subProducts)
        ? data.subProducts
        : (Array.isArray(data.subproducts) ? data.subproducts : []));

    const types = rawTypes.map(normalizeSubProduct).filter(Boolean);

    const tags = Array.isArray(data.tags)
      ? data.tags.filter(Boolean).join(', ')
      : (typeof data.tags === 'string' ? data.tags : '');

    cars.push({
      id: String(data.id),
      imageSrc: data.imageSrc || '',
      youtube: data.youtube || data.youtubeUrl || '',
      youtubeUrl: data.youtube || data.youtubeUrl || '',
      title: data.title,
      description: data.description || '',
      price: Number(data.price) || 0,
      tags: tags,
      types: types,
      content: htmlContent
    });
  }

  // Deterministic sort by ID
  cars.sort((a, b) => a.id.localeCompare(b.id));

  const jsonPayload = JSON.stringify(cars, null, 2);

  // Write root cars.json
  fs.writeFileSync(ROOT_OUTPUT_FILE, jsonPayload);
  console.log(`[build-car] Success: Compiled ${cars.length} vehicles into ${ROOT_OUTPUT_FILE}`);

  // Sync to public/cars.json if public directory exists
  const publicDir = path.dirname(PUBLIC_OUTPUT_FILE);
  if (fs.existsSync(publicDir)) {
    fs.writeFileSync(PUBLIC_OUTPUT_FILE, jsonPayload);
    console.log(`[build-car] Success: Synced ${cars.length} vehicles into ${PUBLIC_OUTPUT_FILE}`);
  }

  return cars;
}

if (require.main === module) {
  generateCarsJson();
}

module.exports = generateCarsJson;
