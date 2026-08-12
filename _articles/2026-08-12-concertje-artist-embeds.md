---
layout: article
title: "concertje embeds: put an artist's tour dates on your own site"
date: 2026-08-12
last_modified_at: 2026-08-12
categories: [web-development, concertje]
tags: [concertje, embeds, widget, artists, music, javascript]
excerpt: "Artists, managers and music blogs keep a tour date list by hand and it is always slightly wrong. concertje embeds are two lines of HTML that show an artist's upcoming shows on any website, updated automatically."
image: /assets/images/articles/concertje-embeds.jpg
---

Every artist website has a tour page. Almost every one of them is out of date.

Not because nobody cares. Because keeping it current means editing HTML, or wrestling a page builder, every time a show is announced, moved, sold out or cancelled. The band already told Instagram, the promoter already put it on their site, the ticket link already exists. Typing it in a fourth place is the part that gets skipped.

concertje already has that data. Around thirty-five scrapers read venue and promoter sites twice a day, for Belgium and the Netherlands, and turn them into shows in one database. If a Belgian venue announces a concert, concertje picks it up within hours. So the list an artist maintains by hand is a worse copy of a list that already maintains itself.

That is what embeds fix.

## Two lines of HTML

```html
<div data-concertje-artist="high-hi">
  <a href="https://concertje.be/artist/high-hi">Concerten van High Hi</a>
</div>
<script async src="https://concertje.be/embed/artist/high-hi.js"></script>
```

Paste that anywhere HTML goes: a Squarespace code block, a WordPress post, a Webflow embed, a plain static site. The script draws the artist's upcoming concerts in place of the div. No account, no API key, no build step.

It loads async, so it never holds up your page, and it renders in the flow of your document instead of an iframe, so it takes your width and does not jump around. No cookies, nothing read from your page.

The link inside the div is not decoration. It is what search engines and anyone without JavaScript see, and it points at the artist page on concertje. The embed replaces it once it loads.

![The concertje embed widget builder, with layout, colour, country, language and price options next to a live preview of Goose's tour dates](/assets/images/articles/concertje-embeds.jpg)
*The embed builder on any artist page: pick your options, copy the snippet, done.*

## The options

Every artist page on concertje now has an embed button that opens the builder above. Whatever you pick is baked into the snippet it gives you.

**Layout** is either poster, with the artist photo on top, or agenda, which is a plain date list for when the design around it is doing the work.

**Colours** default to auto, which follows the visitor's system theme. Light and dark force it, for sites that are one or the other.

**Country** filters to Belgium, the Netherlands or both. Useful for a Dutch label that only wants to show Dutch dates.

**Language** covers Dutch, French, English and German, so the dates and labels match the rest of the page.

**Prices** can be shown or hidden. Management sometimes prefers hidden.

## Who this is for

Artists and bands who want a tour section that stops rotting. Management and labels who look after a roster and do not want to update a dozen sites by hand. Music blogs and venue partners who write about an artist and want the shows next to the piece.

It costs nothing and it needs no permission from us. If the artist exists on concertje, the embed exists.

## What is next

Right now this is per artist. Venues and festivals are the obvious next step, and a genre or city feed after that, so a blog could embed "everything happening in Gent this month".

If you make music, or look after people who do, grab your snippet from your artist page on concertje. If your artist is missing, tell me and I will look at the venue that is not being scraped yet.

Here is the embed running on this page, for [High Hi](https://concertje.be/artist/high-hi):

<div data-concertje-artist="high-hi">
  <a href="https://concertje.be/artist/high-hi">Concerten van High Hi</a>
</div>
<script async src="https://concertje.be/embed/artist/high-hi.js"></script>
