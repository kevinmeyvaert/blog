---
layout: article
title: "concertje.nl is live, and it made me rebuild everything behind the site"
date: 2026-07-31
last_modified_at: 2026-07-31
categories: [web-development, automation]
tags: [concertje, scrapers, bullmq, redis, job-queue, infrastructure]
excerpt: "Launching a Dutch version of concertje meant adding fourteen scrapers in two days. That growth broke the assumptions the old setup rested on, so I spent four nights replacing it with a proper job queue."
---

I have not shipped a visible feature in a week. Nothing new on the site, nothing anyone would notice. All of it went into the part of concertje that nobody sees.

First, the news I never got round to posting: concertje.nl is live. concertje started as a Belgian concert calendar, and it now runs a Dutch version too, on its own domain, with its own venues, its own newsletter and its own login.

That sounds like a front end change. It mostly was not.

## Fourteen scrapers in two days

Everything on concertje comes from scrapers. Every venue, every promoter, every festival gets its own little program that reads their website and turns it into shows in our database. Belgium had built up to around twenty of them over the years, added one at a time as I needed them.

Launching the Netherlands meant Paradiso, Melkweg, TivoliVredenburg, 013, Doornroosje, Effenaar, EKKO, Paard, Rotown, SPOT Groningen, Muziekgieterij, Hedon, and a couple of promoters. Fourteen new scrapers, written and shipped across two days at the start of July.

The scraper count went from about twenty to about thirty-five in a weekend.

Nothing dramatic broke. But a setup that is fine at twenty is not automatically fine at thirty-five, and this one had been built when the number was much smaller.

## What the old setup actually was

All of that scraping ran inside the same container as the admin web app. Eight small cron services on Railway woke up on a schedule and sent an HTTP request to an endpoint in the admin app, and the admin app did the work inside the web request.

At twenty scrapers running one after another, that was tolerable. At thirty-five it was not, and three problems that had been theoretical became real ones.

A scrape that timed out was simply lost, because an HTTP request has no retry. More scrapers meant more timeouts, and every one of them was a venue quietly missing from the site until the next night.

A heavy scrape competed with the website for CPU inside the same container. Doubling the scrapers doubled the competition.

And it was unreliable in a way I had already been bitten by. In June, four of the eight crons stopped firing and nothing alerted. A deploy had wiped a schedule field that lives in the Railway dashboard rather than in the repository. They had no schedule anymore, so they never ran again, and a cron service that never runs looks exactly like a cron service with nothing to do. I only noticed days later, because the site felt stale.

One of those is annoying. All three together, at nearly double the workload, meant the foundation needed replacing rather than patching.

## What I wanted instead

A job queue. Something that owns the schedule in code, retries on failure, and runs the work in a process that is not also serving a website.

I went with BullMQ, which meant introducing Redis to the project. That is a real cost. It is a new piece of infrastructure to run and pay for, and the migration started by making the system bigger before it made it better.

The interesting part was not choosing the tool. It was getting there without breaking a site that runs unattended every night.

## Doing it in phases

I split the work into six phases, each with its own spec and plan. The rule I set myself was that every phase had to be safe to merge on its own, and reversible with a single environment variable.

The first phase moved the schedules into code, registered when the app boots. The cron services stayed alive but with their schedules removed, so rolling back was one field per service.

Then ticket price lookups got their own queue. Prices come from platforms that are slow and rate limited, so that queue runs one job at a time with a daily cap.

After that I moved about 57,000 media files off a mounted volume into object storage, with a temporary fallback that read from the old volume for anything not copied yet. That way the migration could run while the site stayed up.

The remaining cron endpoints became real jobs. Each one now writes a row to the jobs table, so the admin UI shows what ran, when, and what it produced.

The fifth phase extracted the 125 files shared between the web app and the jobs into their own package. Nothing changed at runtime. It existed purely so the last phase was possible.

And the last phase split the worker into its own application and its own Railway service. That is what the whole exercise was for. The scrapers now run in a separate deployment with their own image, 530 MB against the admin app's 2 GB, because it does not carry Next.js at all. They cannot starve the website of CPU, and a crash no longer takes the admin interface down with it.

## The cutover

The thing to avoid is having two workers running at once. Several queues run one job at a time on purpose, and that limit applies per worker, so two of them would quietly double it.

So I sequenced it so the only possible in-between state was no worker at all. Turn the old one off, let jobs pile up in Redis, start the new service, let it drain the backlog. Jobs queue durably, so a gap costs nothing. An overlap would have cost real data.

The whole thing took about twenty minutes. That evening the Instagram bot posted from the new service, and the next morning the nightly scrape ran across all 34 sources with zero failures.

## Where it stands now

The scraping side of concertje is a separate application now, with its own deployment, its own resources and its own failure domain. Jobs retry. Every run is recorded and visible. Schedules live in version control and re-register themselves on every deploy, so a wiped dashboard field cannot silently kill them again. Adding a scraper does not mean touching the web app at all.

It cost a new database to run, a third container, and four nights of work on a site that mostly looked fine from the outside. If you had asked me halfway through, I might have hesitated.

What convinced me was thinking about the next country rather than this one. Adding the Netherlands meant adding load to a system that had no room for it, and I felt every bit of that. Doing it again now would mostly mean writing scrapers, which is the fun part.

The site looks exactly the same as it did last week. I am still glad I spent the week on it.
