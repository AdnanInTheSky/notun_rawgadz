const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

// Define input and output paths
const CONTENT_DIR = path.join(__dirname, 'content', 'product');
const ROOT_OUTPUT_FILE = path.join(__dirname, 'products.json');
const PUBLIC_OUTPUT_FILE = path.join(__dirname, 'public', 'products.json');

function generateProductJson() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`Error: The directory ${CONTENT_DIR} does not exist.`);
    process.exit(1);
  }

  const files = fs.readdirSync(CONTENT_DIR).filter(file => file.endsWith('.md'));
  if (files.length === 0) {
    console.warn(`Warning: No .md files found in ${CONTENT_DIR}`);
  }

  const products = [];

  for (const file of files) {
    const filePath = path.join(CONTENT_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Parse the YAML frontmatter and markdown body
    const { data, content } = matter(fileContent);

    // Hard validation: Skip files that lack core identifiers to prevent broken JSON
    if (!data.id || !data.title) {
      console.warn(`Warning: Skipping ${file}. Missing required 'id' or 'title' in frontmatter.`);
      continue;
    }

    const htmlContent = marked.parse(content || '');

    products.push({
      id: data.id,
      imageSrc: data.imageSrc || "",
      title: data.title,
      description: data.description || "",
      price: Number(data.price) || 0, // Enforce numeric type
      tags: data.tags || "",
      types: Array.isArray(data.types) ? data.types : [], // Enforce array type
      content: htmlContent
    });
  }

  // Sort products deterministically by ID
  products.sort((a, b) => a.id.localeCompare(b.id));

  const jsonPayload = JSON.stringify(products, null, 2);

  // Write to root products.json
  fs.writeFileSync(ROOT_OUTPUT_FILE, jsonPayload);
  console.log(`[build-products] Success: Compiled ${products.length} products into ${ROOT_OUTPUT_FILE}`);

  // Write to public/products.json if public directory exists
  const publicDir = path.dirname(PUBLIC_OUTPUT_FILE);
  if (fs.existsSync(publicDir)) {
    fs.writeFileSync(PUBLIC_OUTPUT_FILE, jsonPayload);
    console.log(`[build-products] Success: Synced ${products.length} products into ${PUBLIC_OUTPUT_FILE}`);
  }

  return products;
}

if (require.main === module) {
  generateProductJson();
}

module.exports = generateProductJson;