---
layout: article
title: "I gave a talk about concertje.be at VI.BE's AB Rendez-Vous"
date: 2026-06-02
last_modified_at: 2026-06-02
categories: [automation, ai]
tags: [talk, concertje, automation, ai, side-project]
excerpt: "VI.BE invited me to give a short talk about concertje.be, a Belgian concert calendar, and the photo pass automation it grew out of. Two takeaways: the data you collect beats the admin you offload, and the projects you filed under 'someday' are now a weekend."
image: /assets/images/articles/talk-concertje-ab-rendez-vous-og.jpg
---

VI.BE invited me to give a short talk at their AB Rendez-Vous event in Brussels last week. Ten minutes, on a tool or workflow, and how others could work with AI. I talked about [concertje.be](https://concertje.be), a Belgian concert calendar I built, and the photo pass automation system it grew out of.

![Giving the talk at VI.BE's AB Rendez-Vous in Brussels, with the daily concertje briefing on screen](/assets/images/articles/talk-concertje-ab-rendez-vous.jpg)
*Ten minutes on stage at AB Rendez-Vous, with the system's daily concertje briefing projected behind me.*

If you've read the earlier post on [the photo pass system](/articles/photo-pass-automation/), some of the setup will sound familiar. This post is the shorter, more reflective version of the talk. There were two things I wanted the room to take away.

## A bit of context

I'm part of Wannabes, a photography collective. We've existed for over fifteen years. With this group we've shot 5756 shows in 391 venues. Since 2020 I've been the one handling every accreditation request.

Last year that had quietly turned into a fulltime job next to my actual fulltime job. Photographers filled in shows, dates wrong, venues wrong, statuses all over the place. For every show I had to figure out who the promoter was. Record label, promoter, venue. Then find the right press contact, send the email, follow it up. At some point I was just postponing applications. We missed photo passes. When new photographers wanted to join, my first thought was "more emails for me."

So I automated it. That part of the story is in the [earlier post](/articles/photo-pass-automation/).

## The first thing I wanted to share

The system worked. It saved me time. But after a few months, the more interesting part wasn't the admin I'd offloaded. It was the data I'd accidentally collected.

Every photo pass request enriches itself with promoter info, venue, artist, date. Every reply gets classified and stored. The system was quietly building a structured database of Belgian concerts. Without me asking it to.

So I built another site on top of that data: [concertje.be](https://concertje.be). A dark, editorial concert calendar for Belgium. Today on the left, dates running down, and per day a grid of shows you can scroll through. Click a date, jump to it.

That's the first thing I wanted to share: **the boring admin you automate is often less valuable than the data you collect along the way.** I built the photo pass system to save myself emails. A year later, the thing I'm most excited about is the side effect.

## The second thing I wanted to share

Concertje.be was a weekend.

For people who code, that's not surprising. The room I was in was a mix of music people, venue people, label people. That line did some work. So let me unpack it.

Saturday morning I sat down with Claude Code. The data was already there (the photo pass system has an API). I knew what I wanted (a dark, editorial calendar). I dictated my prompt using Wispr Flow because typing felt slower than thinking. Roughly what I said:

> I want to build a calendar website for concerts. On the left, a column of dates, with today at the top. On the right, an overview per day showing which concert is happening where. We have images for each show, so use a tile grid people can scroll through. As they scroll, the day in the sidebar should automatically follow along. Clicking a date in the sidebar should also jump you to that day. The data already exists. We built an API for it in our other project, the photo pass system. For the design, use the front-end design skill. I want something simple. Dark, editorial style. If anything is unclear, ask me before you start.

By Sunday evening I had a working site.

That's the second thing: **with AI, the projects you used to file under "someday" are realistically a weekend.** The barrier to "let me just try it" has fully collapsed. If you've been sitting on an idea because it would take three months, it probably wouldn't.

## Why concertje.be exists at all

A few years ago I used to find out about concerts from Instagram stories the morning after. I'd see a band I liked at a venue I knew, and feel that small specific frustration of "I would have gone."

Now I know months in advance what's playing in Belgium. I built the thing I wished existed.

If you make music, work in the live music sector, or just want to know what's playing in Belgium next weekend: [concertje.be](https://concertje.be).

Thanks to VI.BE for the invitation.
