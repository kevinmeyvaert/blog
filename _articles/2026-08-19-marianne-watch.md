---
layout: article
published: true
title: "I built a radio listener to win Fontaines D.C. tickets"
date: 2026-08-19
last_modified_at: 2026-08-19
categories: [automation, ai]
tags: [swift, shazamkit, macos, radio, claude-code]
excerpt: "Studio Brussel is giving away tickets to a Fontaines D.C. showcase. Every few hours they play the new single, and whoever messages the station first goes into the draw. So I built a small app that listens to the stream and tells me when the Fontaines D.C. song is on the radio."
image: /assets/images/articles/marianne-watch-og.jpg
---

Studio Brussel is running a competition next week. Every few hours they play "Marianne", the new Fontaines D.C. single. Listeners who send a message in the station's app the moment it starts go into a draw for tickets to a very small showcase. Enter every time it plays and your odds go up.

I'm a really really really really big fan and I really really really need to get in. 🥺

I cannot sit next to a radio for a week, so I opened Claude Code and described the problem in one paragraph.

![The prompt I sent to Claude Code, describing the radio competition and asking whether the app could be built from a stream URL and the audio file of the single](/assets/images/articles/marianne-watch-prompt.jpg)
*The original brief. One paragraph, ten in the morning.*

I had something working by lunch: a Tauri app doing its own audio fingerprinting, hand-rolled. Then [Tim](https://broddin.be) pointed out that Apple has ShazamKit. So I refactored it into a native macOS app built on that instead, and it works better than what I had.

## What it does

MarianneWatch sits open on my Mac and listens to the Studio Brussel stream, the same way you would hold up your phone to work out what is on.

It names whatever is on the radio, and only shouts when it is Fontaines D.C. When it hears them it posts to Discord, fires a macOS notification, and brings up the VRT MAX chat with my message already typed. All that is left is pressing send.

![The app listening to Studio Brussel, showing The Strokes - Bad Decisions as the current track](/assets/images/articles/marianne-watch-listening.jpg)
*Most of the time it just tells you what is on.*

## Jingles are a problem

Working well has its own failure mode. Studio Brussel drops snippets of Fontaines into their own jingles and adverts, and the app fired on every single one.

The fix is patience. It has to hear the same song twice in a row, about ten seconds, before it does anything. A hook in a jingle does not last that long. A song does.

![The app with the rings turned red, showing Marianne by Fontaines D.C. confirmed and sent to Discord](/assets/images/articles/marianne-watch-match.jpg)
*Rings go red, alerts go out. That is the whole point of the thing.*

## Where it stands

It has already caught a real play, five seconds into the song, and everything in it is checked against recordings off the actual radio rather than my assumptions.

The competition itself starts next week. This week is for testing, so that when it counts the thing already works.

## How this can help you win tickets

I have made a channel in the [concertje Discord](https://discord.gg/k9SMHQEQzA). Every time the app hears Marianne on Studio Brussel, it posts there. Join, turn on notifications for that channel, and you get the same alert I do, at the same moment.

Then open the Studio Brussel app and send your message. May the odds be in your favor. 💖
