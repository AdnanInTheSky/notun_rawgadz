const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Input and output file paths
const CONTENT_DIR = path.join(__dirname, 'content', 'index');
const ROOT_OUTPUT_FILE = path.join(__dirname, 'index.json');
const PUBLIC_OUTPUT_FILE = path.join(__dirname, 'public', 'index.json');

/**
 * Reads markdown files from content/index and compiles index.json
 */
function generateIndexJson() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.warn(`[build-index] Creating missing directory: ${CONTENT_DIR}`);
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  }

  const files = fs.readdirSync(CONTENT_DIR).filter(file => file.endsWith('.md'));
  if (files.length === 0) {
    console.warn(`[build-index] Warning: No .md files found in ${CONTENT_DIR}`);
  }

  const items = [];

  for (const file of files) {
    const filePath = path.join(CONTENT_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    const { data } = matter(fileContent);

    if (!data.image && !data.imageSrc && !data.tag && !data.label) {
      console.warn(`[build-index] Skipping ${file}: Missing image/tag/label fields.`);
      continue;
    }

    items.push({
      _order: typeof data.order === 'number' ? data.order : 9999,
      _file: file,
      image: data.image || data.imageSrc || '',
      tag: String(data.tag || '').trim(),
      label: String(data.label || data.title || '').trim()
    });
  }

  // Deterministic sort by order then by filename
  items.sort((a, b) => {
    if (a._order !== b._order) return a._order - b._order;
    return a._file.localeCompare(b._file);
  });

  // Strip internal sort keys
  const outputData = items.map(({ _order, _file, ...item }) => item);

  const jsonPayload = JSON.stringify(outputData, null, 2);

  // Write root index.json
  fs.writeFileSync(ROOT_OUTPUT_FILE, jsonPayload, 'utf-8');
  console.log(`[build-index] Success: Compiled ${outputData.length} items into ${ROOT_OUTPUT_FILE}`);

  // Write to public/index.json if public directory exists
  const publicDir = path.dirname(PUBLIC_OUTPUT_FILE);
  if (fs.existsSync(publicDir)) {
    fs.writeFileSync(PUBLIC_OUTPUT_FILE, jsonPayload, 'utf-8');
    console.log(`[build-index] Success: Synced ${outputData.length} items into ${PUBLIC_OUTPUT_FILE}`);
  }

  return outputData;
}

if (require.main === module) {
  generateIndexJson();
}

module.exports = generateIndexJson;
