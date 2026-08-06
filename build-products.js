const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Define your input and output paths
const CONTENT_DIR = path.join(__dirname, 'content', 'product');
const OUTPUT_FILE = path.join(__dirname, 'public', 'products.json'); // Adjust output directory as needed

function generateProductJson() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`Error: The directory ${CONTENT_DIR} does not exist.`);
    process.exit(1);
  }

  // Ensure the output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const files = fs.readdirSync(CONTENT_DIR).filter(file => file.endsWith('.md'));
  const products = [];

  for (const file of files) {
    const filePath = path.join(CONTENT_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Parse the YAML frontmatter
    const { data } = matter(fileContent);

    // Hard validation: Skip files that lack core identifiers to prevent broken JSON
    if (!data.id || !data.title) {
      console.warn(`Warning: Skipping ${file}. Missing required 'id' or 'title' in frontmatter.`);
      continue;
    }

    products.push({
      id: data.id,
      imageSrc: data.imageSrc || "",
      title: data.title,
      description: data.description || "",
      price: Number(data.price) || 0, // Enforce numeric type
      tags: data.tags || "",
      types: Array.isArray(data.types) ? data.types : [] // Enforce array type
    });
  }

  // Write the JSON payload
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(products, null, 2));
  console.log(`Success: Compiled ${products.length} products into ${OUTPUT_FILE}`);
}

generateProductJson();