---
layout: article
title: "From manual emails to a fully automated photo pass system"
date: 2026-01-24
last_modified_at: 2026-01-24
categories: [automation, software-engineering]
tags: [automation, n8n, workflow, ai, full-stack, gpt, discord, email-processing]
excerpt: "How I transformed a tedious manual photo pass request process into a fully automated system that saves hours every month and made managing a photography collective enjoyable again."
image: /assets/images/articles/photo-pass-automation-og.jpg
---
I have been part of the photography collective Wannabes for about seven years now, already before covid. Over time I gradually took on the responsibility of handling most of the photo pass requests for the photographers in the collective. At first this felt manageable. It slowly turned into a surprisingly heavy operational task.

Requesting photo passes sounds simple, but it rarely is. For every concert, you need to figure out who the promoter is, find the right press contact, send out emails and then follow everything up. Applications need to be sent well in advance, while replies often arrive only a day or two before the show. In the meantime you are tracking approvals, rejections and confirmations, and making sure every photographer knows where they stand.

Doing this for a handful of shows is fine. Doing it for dozens every month is not. A lot of time went into searching press websites and copying information around. Because the process was so tedious, I sometimes postponed applications. That meant we were late and missed photo passes. It also meant I was not very motivated to let more photographers join the collective, simply because that would create even more manual work.

At some point it became clear that this could not stay this way. The process needed to be automated. Not only to save time, but also to make it consistent and scalable.

## The first attempt at automation

I had already seen n8n pass by on social media a couple of times as a workflow automation tool. I never really took the time to try it properly. In October of last year I decided to spend a full day turning my entire manual workflow into an automated one. I started with n8n Cloud because I wanted to move fast and avoid spending time on infrastructure before knowing whether the idea would even work.

![n8n workflow automation](/assets/images/articles/n8n-workflow.png)
*The n8n workflow that automated photo pass requests. It handled everything from scraping shows to generating emails.*

The first version was surprisingly extensive. I scraped the Live Nation press website to keep a list of upcoming shows in a Google Sheet, since most of our concerts come from there. I created a form using Tally where photographers could submit their requests. Every submission triggered a workflow that matched the request to the correct show and enriched it with promoter contact details. On the first day of each month, another workflow generated draft emails using ChatGPT, ready to be sent to promoters.

## Using it for real

We decided to actually use this setup for the last couple of months of the year. It worked well enough to already save a lot of time. At the same time, n8n Cloud turned out to be quite expensive, so I moved everything to my own NAS. I cleaned up the workflows and added Discord notifications for every important step. That way I only had to intervene when something was missing or when a show was not coming from Live Nation.

Incoming replies were still handled manually. I received a notification in Discord and then checked my mailbox to see whether a request was approved, rejected or simply acknowledged. It was not perfect, but it was a big improvement. That is how we closed the year.

## A new job and a new idea

In December 2025 I switched jobs. I had mostly worked as a front end engineer before, but my new role is much more full stack. I was looking for a real project to get more comfortable with the technologies we use at work. The timing felt right to turn the automated workflows into a proper application.

Over the course of a weekend I built the bare bones of what is now our photo pass request system. Photographers can log in and see a dashboard with their requests and their current status. They can browse and search through upcoming concerts that are automatically fetched from multiple sources.

## One central place for all concert data

![Concert dashboard showing upcoming shows](/assets/images/articles/concerts-dashboard.png)
*The concert dashboard where photographers can browse and search upcoming shows. All press contacts and venue information are automatically fetched.*

The system now scrapes not only Live Nation, but also venues like AB and De Roma, as well as other places our photographers frequently cover. Because all shows already exist in the system, photographers can simply type an artist name and select the correct show. All relevant press and promoter information is already attached. Almost no manual searching is needed anymore.

## Automating the follow up

On the admin side, all incoming requests are visible in one place. At first this was mostly an interface layer on top of the existing automation. Soon after, I decided to automate the follow up process as well.

I built a service that monitors my mailbox and automatically classifies incoming emails. It extracts which show and which request the email refers to, updates the status in the system and sends a notification to the photographer when a decision is made.

![Email logs dashboard](/assets/images/articles/email-logs.png)
*The email logs interface showing automated classification of incoming emails. The system extracts show details, matches requests, and updates statuses automatically.*

If a promoter replies that a photographer is approved under certain conditions, those conditions are included automatically. The photographer receives an email with all the details without me having to touch anything. I still receive Discord notifications so I can keep an eye on things and step in when needed.

![Discord notifications on mobile](/assets/images/articles/discord-notifications.jpg)
*Discord notifications keep me informed of new concerts, photo requests, and any issues that need manual intervention.*

## Handling fairness inside the collective

One tricky edge case was handling multiple photographers requesting the same show. I built a simple assignment system that keeps track of how many opportunities each photographer has had. That makes it easier to distribute assignments more fairly across the collective.

## Where the system stands today

The application now runs on Google Cloud and is actively used by Wannabes. It saves time, reduces mistakes and removes a lot of mental overhead. Most importantly, it made the whole process enjoyable again. Building it genuinely made me happy.

![Admin dashboard overview](/assets/images/articles/admin-dashboard.png)
*The admin dashboard showing pending requests, recent updates, and new submissions. Everything I need to manage the collective in one place.*

What this project confirmed for me is how much I enjoy solving real world problems through automation. If you have a workflow in your business, hobby or organization that feels clunky or overly manual, I am always happy to think along. Sometimes a bit of advice is enough. Sometimes it makes sense to build something. Either way, feel free to reach out.
