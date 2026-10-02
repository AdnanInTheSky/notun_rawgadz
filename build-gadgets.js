const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Input and output file paths
const CONTENT_DIR = path.join(__dirname, 'content', 'gadgets');
const ROOT_OUTPUT_FILE = path.join(__dirname, 'gadgets.json');
const PUBLIC_OUTPUT_FILE = path.join(__dirname, 'public', 'gadgets.json');

/**
 * Reads markdown files from content/gadgets and compiles gadgets.json
 */
function generateGadgetsJson() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.warn(`[build-gadgets] Creating missing directory: ${CONTENT_DIR}`);
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  }

  const files = fs.readdirSync(CONTENT_DIR).filter(file => file.endsWith('.md'));
  if (files.length === 0) {
    console.warn(`[build-gadgets] Warning: No .md files found in ${CONTENT_DIR}`);
  }

  const items = [];

  for (const file of files) {
    const filePath = path.join(CONTENT_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    const { data } = matter(fileContent);

    if (!data.image && !data.imageSrc && !data.tag && !data.label) {
      console.warn(`[build-gadgets] Skipping ${file}: Missing image/tag/label fields.`);
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

  // Write root gadgets.json
  fs.writeFileSync(ROOT_OUTPUT_FILE, jsonPayload, 'utf-8');
  console.log(`[build-gadgets] Success: Compiled ${outputData.length} items into ${ROOT_OUTPUT_FILE}`);

  // Write to public/gadgets.json if public directory exists
  const publicDir = path.dirname(PUBLIC_OUTPUT_FILE);
  if (fs.existsSync(publicDir)) {
    fs.writeFileSync(PUBLIC_OUTPUT_FILE, jsonPayload, 'utf-8');
    console.log(`[build-gadgets] Success: Synced ${outputData.length} items into ${PUBLIC_OUTPUT_FILE}`);
  }

  return outputData;
}

if (require.main === module) {
  generateGadgetsJson();
}

module.exports = generateGadgetsJson;
