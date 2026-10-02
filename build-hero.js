const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Input and output file paths
const CONTENT_DIR = path.join(__dirname, 'content', 'hero');
const ROOT_OUTPUT_FILE = path.join(__dirname, 'hero.json');
const PUBLIC_OUTPUT_FILE = path.join(__dirname, 'public', 'hero.json');

/**
 * Normalizes page key
 */
function normalizePageKey(key) {
  if (!key) return 'index';
  const clean = String(key).toLowerCase().trim();
  if (clean === 'cars' || clean === 'car' || clean.startsWith('car')) return 'car';
  if (clean === 'gadgets' || clean === 'gadget') return 'gadgets';
  if (clean === 'index' || clean === 'home') return 'index';
  return clean;
}

/**
 * Recursively scans directory for markdown files
 */
function getMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Reads markdown files from content/hero and compiles hero.json
 */
function generateHeroJson() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.warn(`[build-hero] Creating missing directory: ${CONTENT_DIR}`);
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  }

  const files = getMarkdownFiles(CONTENT_DIR);
  if (files.length === 0) {
    console.warn(`[build-hero] Warning: No .md files found in ${CONTENT_DIR}`);
  }

  const groupedSlides = {
    index: [],
    gadgets: [],
    car: []
  };

  for (const filePath of files) {
    const fileName = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(fileContent);

    // Determine target page
    let targetPage = data.page;
    if (!targetPage) {
      if (fileName.toLowerCase().includes('gadget')) targetPage = 'gadgets';
      else if (fileName.toLowerCase().includes('car')) targetPage = 'car';
      else targetPage = 'index';
    }
    const pageKey = normalizePageKey(targetPage);

    // If file defines an array of slides
    if (Array.isArray(data.slides)) {
      data.slides.forEach((s, idx) => {
        if (!s || (!s.src && !s.url && !s.image && !s.video)) return;
        groupedSlides[pageKey] = groupedSlides[pageKey] || [];
        groupedSlides[pageKey].push({
          _order: typeof s.order === 'number' ? s.order : idx + 1,
          _file: `${fileName}_${idx}`,
          type: s.type || (s.video ? 'video' : 'image'),
          src: s.src || s.url || s.image || s.video,
          ...(s.poster ? { poster: s.poster } : {}),
          ...(s.alt ? { alt: s.alt } : {})
        });
      });
      continue;
    }

    // Single slide per markdown file
    const src = data.src || data.url || data.image || data.video;
    if (!src) {
      console.warn(`[build-hero] Skipping ${fileName}: Missing 'src' or 'image' field.`);
      continue;
    }

    const type = data.type || (data.video || /\.(mp4|webm|ogg)$/i.test(src) || src.includes('youtube') ? 'video' : 'image');

    groupedSlides[pageKey] = groupedSlides[pageKey] || [];
    groupedSlides[pageKey].push({
      _order: typeof data.order === 'number' ? data.order : 9999,
      _file: fileName,
      type: type,
      src: src,
      ...(data.poster ? { poster: data.poster } : {}),
      ...(data.alt ? { alt: data.alt } : {})
    });
  }

  // Sort slides for each page and remove internal sort keys
  const outputData = {};
  for (const page of ['index', 'gadgets', 'car']) {
    const list = groupedSlides[page] || [];
    list.sort((a, b) => {
      if (a._order !== b._order) return a._order - b._order;
      return a._file.localeCompare(b._file);
    });
    outputData[page] = list.map(({ _order, _file, ...slide }) => slide);
  }

  // Add 'cars' alias for convenience and backwards-compatibility
  outputData.cars = outputData.car;

  const jsonPayload = JSON.stringify(outputData, null, 2);

  // Write root hero.json
  fs.writeFileSync(ROOT_OUTPUT_FILE, jsonPayload, 'utf-8');
  console.log(`[build-hero] Success: Compiled hero slides (index: ${outputData.index.length}, gadgets: ${outputData.gadgets.length}, car: ${outputData.car.length}) into ${ROOT_OUTPUT_FILE}`);

  // Write to public/hero.json if public directory exists
  const publicDir = path.dirname(PUBLIC_OUTPUT_FILE);
  if (fs.existsSync(publicDir)) {
    fs.writeFileSync(PUBLIC_OUTPUT_FILE, jsonPayload, 'utf-8');
    console.log(`[build-hero] Success: Synced hero slides into ${PUBLIC_OUTPUT_FILE}`);
  }

  return outputData;
}

if (require.main === module) {
  generateHeroJson();
}

module.exports = generateHeroJson;
