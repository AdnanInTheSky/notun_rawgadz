const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

// Define input and output paths
const CONTENT_DIR = path.join(__dirname, 'content', 'blog');
const ROOT_OUTPUT_FILE = path.join(__dirname, 'blog.json');
const PUBLIC_OUTPUT_FILE = path.join(__dirname, 'public', 'blog.json');

function generateBlogJson() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`Error: The directory ${CONTENT_DIR} does not exist.`);
    process.exit(1);
  }

  const files = fs.readdirSync(CONTENT_DIR).filter(file => file.endsWith('.md'));
  if (files.length === 0) {
    console.warn(`Warning: No .md files found in ${CONTENT_DIR}`);
  }

  const blogs = [];

  for (const file of files) {
    const filePath = path.join(CONTENT_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Parse YAML frontmatter and markdown body
    const { data, content } = matter(fileContent);

    // Skip files that lack core identifiers
    if (!data.id || !data.title) {
      console.warn(`Warning: Skipping ${file}. Missing required 'id' or 'title' in frontmatter.`);
      continue;
    }

    const htmlContent = marked.parse(content || '');

    const tags = Array.isArray(data.tags)
      ? data.tags.filter(Boolean).join(', ')
      : (typeof data.tags === 'string' ? data.tags : '');

    blogs.push({
      id: String(data.id),
      title: data.title,
      date: data.date || '',
      author: data.author || 'Rawgad Team',
      excerpt: data.excerpt || data.description || '',
      imageSrc: data.imageSrc || '',
      tags: tags,
      content: htmlContent
    });
  }

  // Sort blogs deterministically by id
  blogs.sort((a, b) => a.id.localeCompare(b.id));

  const jsonPayload = JSON.stringify(blogs, null, 2);

  // Write to root blog.json
  fs.writeFileSync(ROOT_OUTPUT_FILE, jsonPayload);
  console.log(`[build-blog] Success: Compiled ${blogs.length} blog posts into ${ROOT_OUTPUT_FILE}`);

  // Write to public/blog.json if public directory exists
  const publicDir = path.dirname(PUBLIC_OUTPUT_FILE);
  if (fs.existsSync(publicDir)) {
    fs.writeFileSync(PUBLIC_OUTPUT_FILE, jsonPayload);
    console.log(`[build-blog] Success: Synced ${blogs.length} blog posts into ${PUBLIC_OUTPUT_FILE}`);
  }

  return blogs;
}

if (require.main === module) {
  generateBlogJson();
}

module.exports = generateBlogJson;
