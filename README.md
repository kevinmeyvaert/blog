# Kevin Meyvaert - Photography & Articles

A minimalist photography portfolio and blog built with Jekyll, migrated from Tumblr.

## Features

- **Photo Gallery**: Paginated masonry grid with fullscreen modal viewer
- **Technical Blog**: Separate articles section for writing about photography, development, and running
- **Image Optimization**: Automatic responsive images with AVIF/WebP/JPEG formats
- **Mobile Responsive**: Fixed sidebar on desktop, hamburger menu on mobile
- **Keyboard Navigation**: Arrow keys for photo navigation, ESC to close modals

## Quick Start

```bash
bundle install
bundle exec jekyll serve
```

Visit `http://localhost:4000`

## Project Structure

```
├── _posts/                 # Photo posts (pagination source)
├── _articles/              # Blog articles
├── _layouts/
│   ├── default.html        # Base layout with sidebar
│   ├── post.html           # Single photo layout
│   └── article.html        # Blog article layout
├── assets/
│   ├── images/             # Original photos
│   └── generated/          # Optimized images (auto-generated)
├── index.html              # Photo gallery homepage (paginated)
└── articles.html           # Blog listing page
```

## Adding Content

### Photos

Create a file in `_posts/` with format `YYYY-MM-DD-title.md`:

```yaml
---
layout: post
date: 2025-01-15 14:30:00 +0100
image: /assets/images/photo.jpg
width: 4000
height: 2667
tags:
  - leicam6
  - portra400
---
```

### Blog Articles

Create a file in `_articles/` with format `YYYY-MM-DD-title.md`:

```yaml
---
layout: article
title: "Your Article Title"
date: 2025-01-15
categories: [photography, development]
tags: [jekyll, workflow]
excerpt: "Short description for listing page"
---

Your article content in Markdown...
```

## Image Optimization

Photos are automatically optimized by `jekyll_picture_tag`:
- Multiple formats: AVIF, WebP, JPEG
- Responsive widths: 640px, 1024px, 1600px, 1920px
- Lazy loading enabled
- Dimensions preserved from original images

Add image dimensions using:
```bash
sips -g pixelWidth -g pixelHeight assets/images/photo.jpg
```

## Configuration

Edit `_config.yml` to customize:
- Site title and tagline
- Navigation links
- Social media links
- Pagination (currently 10 photos per page)

## Deployment

### GitHub Pages

1. Push to GitHub repository
2. Enable Pages in Settings → Pages
3. Deploy from `main` branch

### Custom Domain

1. Create `CNAME` file with your domain
2. Configure DNS with CNAME record pointing to `username.github.io`
3. Update `url` in `_config.yml`

## URL Structure

- `/` - Photo gallery (paginated)
- `/page/2/` - Pagination pages
- `/articles` - Blog listing
- `/articles/article-title` - Individual articles

## Key Plugins

- `jekyll-paginate` - Homepage pagination (GitHub Pages compatible)
- `jekyll_picture_tag` - Responsive image optimization
- `jekyll-feed` - RSS feed generation

## License

All content and photography © Kevin Meyvaert
