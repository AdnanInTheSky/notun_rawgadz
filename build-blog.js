const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');

// Define paths
const CONTENT_DIR = path.join(__dirname, 'content/blog');
const OUTPUT_DIR = path.join(__dirname, 'public');
const BLOG_OUT_DIR = path.join(OUTPUT_DIR, 'blog');

// 1. Ensure output directories exist
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(BLOG_OUT_DIR)) {
    fs.mkdirSync(BLOG_OUT_DIR, { recursive: true });
}

// Basic HTML Template wrapper
const htmlTemplate = (title, content) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        /* Add your own CSS here */
        body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .card { border: 1px solid #ccc; padding: 16px; margin-bottom: 16px; border-radius: 8px; }
        a { text-decoration: none; color: #007BFF; }
    </style>
</head>
<body>
    <nav><a href="/blog.html">← Back to Blogs</a></nav>
    ${content}
</body>
</html>`;

// 2. Read all markdown files
const files = fs.readdirSync(CONTENT_DIR).filter(file => file.endsWith('.md'));
const blogsData = [];

files.forEach(file => {
    const rawContent = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8');
    
    // Parse frontmatter and markdown content
    const { data, content } = matter(rawContent);
    const htmlContent = marked.parse(content);
    const slug = file.replace('.md', '');
    
    // Fallbacks if you forgot to add frontmatter
    const title = data.title || slug;
    const date = data.date || new Date().toISOString().split('T')[0];
    const excerpt = data.excerpt || 'Read this post...';
    
    const postUrl = `./blog/${slug}.html`;

    // 3. Create individual blog HTML page
    const pageContent = `
        <article>
            <h1>${title}</h1>
            <p><small>${date}</small></p>
            <div>${htmlContent}</div>
        </article>
    `;
    fs.writeFileSync(path.join(BLOG_OUT_DIR, `${slug}.html`), htmlTemplate(title, pageContent));

    // Push metadata to array for json and index generation
    blogsData.push({ title, date, excerpt, slug, url: postUrl });
});

// 4. Sort blogs by date (newest first)
blogsData.sort((a, b) => new Date(b.date) - new Date(a.date));

// 5. Generate blogs.json
fs.writeFileSync(
    path.join(OUTPUT_DIR, 'blogs.json'), 
    JSON.stringify(blogsData, null, 2)
);

// 6. Generate blog.html (The main page with cards)
const cardsHtml = blogsData.map(blog => `
    <div class="card">
        <h2><a href="${blog.url}">${blog.title}</a></h2>
        <p><small>${blog.date}</small></p>
        <p>${blog.excerpt}</p>
        <a href="${blog.url}">Read Article</a>
    </div>
`).join('\n');

const indexContent = `
    <h1>All Blog Posts</h1>
    <div class="grid">
        ${cardsHtml}
    </div>
`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'blog.html'), htmlTemplate('Blog', indexContent));

console.log(`✅ Build complete. Processed ${files.length} files. Check the '/public' directory.`);