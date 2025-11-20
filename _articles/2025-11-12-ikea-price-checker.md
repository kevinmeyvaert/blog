---
layout: article
title: "I built an IKEA price checker for a friend's renovation"
date: 2025-11-12
last_modified_at: 2025-11-12
categories: [web-development, ai]
tags: [ikea, web-scraping, side-project, chrome-extension]
excerpt: "How I built a price comparison tool that saved €1,000 on a kitchen renovation by checking IKEA prices across Belgium, the Netherlands, France, and Germany."
image: /assets/images/articles/ikea-price-checker-og.jpg
---

A friend was redoing his kitchen.
He told me IKEA prices aren't the same everywhere.
Same product, different country, different price.
He checked them one by one across Belgium, the Netherlands, and France.

His kitchen plan had ninety-eight products from the IKEA kitchen configurator.
That sounded painful to track by hand.

He said, "It's strange. The exact same cabinet is cheaper across the border."
That line stuck with me.
He didn't need another spreadsheet.
He needed a small tool that did the checking for him.

So I started building one that same afternoon.


## From idea to first version

I didn't start by writing code.
I asked GPT-5 what would make a good IKEA price comparison tool.
It suggested simple features: search by product code, compare countries, highlight the lowest price, show stock, and maybe handle full shopping lists later.

Then I opened Claude Code to build it.
Within minutes, we had a working prototype.
Type an IKEA article number and it fetched prices from Belgium, the Netherlands, and France.
It took less time to make than opening three IKEA sites by hand.

![KOMPRÅRE first version](/assets/images/articles/komprare-v1.jpg)
*The first working version of the IKEA price checker. "ship it?" I send to my friend via text.*


## Building beyond the basics

Once the basics worked, I asked GPT-5 what else people might want.
It suggested checking stock by store, uploading shopping lists, exporting results, and adding a browser plugin.
That became my plan.

I added live store availability first.
IKEA has no public product API, so I scraped pages and checked the numbers against the site until they matched.

Then came shopping list mode.
You can upload an IKEA shopping list PDF.
The app reads the product codes, checks prices across countries, and shows which stores give the lowest total.
It can export that plan as a clear PDF.

![KOMPRÅRE second version](/assets/images/articles/komprare-v2.jpg)
*I just prompted the shopping list (pdf) feature. "will it work first try"*

The next step was the Chrome plugin.
It adds a section that appears automatically on IKEA product pages.
The section shows the price comparison for that product right inside the page.
It feels native, as if IKEA quietly added it themselves.

Those ideas came from GPT-5 brainstorms.
Claude Code helped turn them into working parts.


## Two AIs, different jobs

Claude Code handled development.
It wrote functions, API routes, and scrapers fast.
When something failed, I gave it the error and product ID.
It helped narrow the fix.

GPT-5 handled the product side.
It asked why a feature mattered and how people would use it.
That mix kept the code moving and the scope tight.

<div class="image-grid">
  <div class="image-grid-item">
    <img src="/assets/images/articles/komprare-pm-1.png" alt="KOMPRÅRE name brainstorm">
  </div>
  <div class="image-grid-item">
    <img src="/assets/images/articles/komprare-pm-2.png" alt="KOMPRÅRE logo design">
  </div>
</div>
*I wasn't feeling creative naming this project, but GPT-5 helped. He also helped out making the logo, who needs desigers anyway 🤷‍♂️*


## Managing the project

I gave Claude Code my article [Architecting for AI](/articles/architecting-for-ai/) as context.
That shaped the structure.
All generated code lived in one Nx monorepo.
The scraping, authentication and analytics logic were shared by the web app and the Chrome plugin.
It kept the setup clean instead of a collection of one-off scripts.

![Project tree](/assets/images/articles/komprare-arch.png)
*I like clean project trees and efficient code reuse 🤝🏻*

## Clauding on the go

While building this project, I tried a new feature from Claude.
They have a mobile app where you can link your repository and send prompts from your phone.
The next day after finishing the app, I was at work when my girlfriend texted me.
She couldn’t import shopping lists from the IKEA mobile app because those links used a different format.
At the coffee machine, I opened Claude on my iPhone, pasted her link, and typed:

<div class="image-grid">
  <div class="image-grid-item">
    <img src="/assets/images/articles/komprare-claude-1.jpg" alt="The prompt">
  </div>
  <div class="image-grid-item">
    <img src="/assets/images/articles/komprare-claude-2.jpg" alt="The pull requests">
  </div>
</div>
*It's the productmanagerification of software development*


## What the app does now

You can type any IKEA product code.
It shows prices for Belgium, the Netherlands, France, and Germany.
It marks the lowest price.
It checks stock for specific stores.
You can upload a shopping list and get a per-store breakdown with totals.
And on IKEA's own pages, the Chrome plugin shows the same comparison right below the product details.

You can find the code on [GitHub](https://github.com/kevinmeyvaert/ikea-compare)
and visit the live app at [komprare.vercel.app](https://komprare.vercel.app).
The Chrome plugin is in review and should be publicly available soon.
