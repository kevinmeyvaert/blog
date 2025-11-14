<div align="center">

# Kevin Meyvaert - Photography & Articles

> A minimalist photography portfolio and blog showcasing personal film photography alongside technical articles about development, photography, and running.

[![Jekyll](https://img.shields.io/badge/Jekyll-4.4.x-CC0000?style=flat&logo=jekyll&logoColor=white)](https://jekyllrb.com/)
[![Ruby](https://img.shields.io/badge/Ruby-3.x-CC342D?style=flat&logo=ruby&logoColor=white)](https://www.ruby-lang.org/)
[![GitHub Pages](https://img.shields.io/badge/Deployed%20on-GitHub%20Pages-222222?style=flat&logo=github&logoColor=white)](https://pages.github.com/)
[![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat)](LICENSE)

🌐 **[kevinmeyvaert.be](https://kevinmeyvaert.be)**

</div>

## Overview

This Jekyll-powered website serves as both a photography portfolio and technical blog, migrated from Tumblr with a focus on clean design and optimal image delivery. The site features a paginated photo gallery, dedicated articles section, and integrated running statistics from Strava.

## Technology Stack

**Framework & Build:**
- Jekyll 4.4.x for static site generation
- Ruby for template processing and plugins
- Liquid templating engine

**Image Processing:**
- jekyll_picture_tag for responsive image optimization
- Sharp (via libvips) for server-side processing
- Multi-format output: AVIF, WebP, JPEG

**Content Management:**
- Jekyll Collections for articles
- Jekyll Paginate for photo gallery pagination
- Front Matter for metadata and configuration

**Deployment:**
- GitHub Pages compatible
- Custom domain support via CNAME

## Key Features

The portfolio emphasizes **Progressive Image Loading** with multi-format responsive images (AVIF/WebP/JPEG fallbacks), lazy loading, and automatic dimension preservation. **Dual Content Types** separate photo posts from long-form articles, each with dedicated layouts and navigation.

Additional capabilities include **Keyboard Navigation** for gallery browsing (arrow keys + ESC), **Mobile-First Design** with a fixed sidebar on desktop and hamburger menu on mobile, and **RSS Feed** generation for blog subscribers.

## Project Architecture

**Content Structure:**
- `_posts/`: Photo posts that populate the paginated homepage gallery
- `_articles/`: Blog articles with separate collection and permalink structure
- `_layouts/`: Template hierarchy (default → post/article)

**Image Strategy:**
Multi-format responsive images generated automatically with srcset attributes for adaptive loading. Original images stored in `assets/images/` with optimized variants in `assets/generated/`.

**URL Structure:**
- `/` - Paginated photo gallery (10 photos per page)
- `/page/2/` - Pagination pages
- `/articles` - Blog article listing
- `/articles/article-title` - Individual articles
- `/running` - Strava activity dashboard

## Development Workflow

**Initial Setup:**
```bash
bundle install
bundle exec jekyll serve
```

Visit `http://localhost:4000` to preview locally.

**Adding Photos:**

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

Get image dimensions with:
```bash
sips -g pixelWidth -g pixelHeight assets/images/photo.jpg
```

**Adding Articles:**

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

**Configuration:**

Edit `_config.yml` to customize:
- Site title, tagline, and description
- Navigation menu items
- Social media links (Instagram, email)
- Pagination settings
- Image optimization presets

## Deployment

**GitHub Pages:**

1. Push to GitHub repository
2. Enable Pages in Settings → Pages
3. Deploy from `main` branch

## License

All Rights Reserved © 2025 Kevin Meyvaert

All content, photography, and code in this repository are proprietary. No permission is granted to copy, distribute, or modify any part of this project without explicit written consent from the author.
