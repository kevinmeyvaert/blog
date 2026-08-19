---
layout: article
published: false
title: "I built a radio listener to win Fontaines D.C. tickets"
date: 2026-08-19
last_modified_at: 2026-08-19
categories: [automation, ai]
tags: [tauri, rust, audio-fingerprinting, chromaprint, radio, claude-code]
excerpt: "Studio Brussel plays one song every few hours and the first listeners to message win tickets. I could not sit next to a radio for a week, so I built something that listens for me, and then had to prove it was listening to the right song."
image: /assets/images/articles/marianne-watch-og.jpg
---

Studio Brussel is running a competition next week. Every few hours they play "Marianne", the new Fontaines D.C. single. Listeners who send a message in the station's app the moment it starts go into a draw for tickets to a very small showcase. Enter every time it plays and your odds go up.

I'm a really really really really big fan and I really really really need to get in. 🥺

I opened Claude Code and described the problem in one paragraph. Here is a stream URL, here is the audio file of the single, can we build something that listens and tells me. That was around ten in the morning. By early afternoon there was a desktop app on my Mac listening to Studio Brussel continuously.

![The prompt I sent to Claude Code, describing the radio competition and asking whether the app could be built from a stream URL and the audio file of the single](/assets/images/articles/marianne-watch-prompt.jpg)
*The entire brief. One paragraph, ten in the morning.*

## The track title is useless

The obvious approach is to read what is playing. Icecast streams carry ICY metadata, and Studio Brussel does broadcast the track title.

It is no good for this. The title updates when it feels like it. It goes stale during talk breaks, and it sits there showing the previous song while the new one is already three verses in. Trigger on that and you either miss the window entirely or fire during the news.

## How it actually listens

The app listens to the sound itself. `ffmpeg` pulls in the stream, and once a second the last six seconds get turned into a fingerprint, a compact summary of what that bit of audio sounds like. The single I dragged in gets the same treatment.

It gets fingerprinted three times, at normal speed and slightly either side of it. Radio stations quietly speed music up to fit more into an hour, and a fingerprint at the wrong speed does not match.

Two of those snippets in a row that look close enough, and it fires. A Discord webhook, a macOS notification, and a twelve minute quiet period so one play does not produce forty alerts.

## The first thing it caught was the wrong song

The first time it went off, it was not Marianne. Some other track had come close enough to fool it.

The app keeps the last forty-five seconds of audio in memory and saves them to a file whenever something fires. That was there for the jingles, the bit the station plays just before a song, so I can teach the app those too and get an even earlier warning. It turned out to be just as handy here. I had a recording of exactly what had tricked it, so instead of guessing I could tighten the rules until it stopped happening.

## Sending the message

When Marianne is detected, a second window inside the app comes to the front with the VRT MAX chat open and my message already typed into the box. All that is left is pressing send.

## Where it stands

The app runs, and everything in it is checked against real recordings rather than my assumptions.

It has already caught a real play. Marianne came on and the app fired five seconds in, and the recording it saved holds the jingle the station plays just before the song. Fingerprinting that jingle is the next thing on the list, because it would buy another few seconds.

![The marianne watch app listening to the Studio Brussel stream, showing a match at 13:14:44 with a score of 0.152, five seconds into the track](/assets/images/articles/marianne-watch-app.jpg)
*A real catch. Five seconds into the song, clip saved.*

The competition itself starts next week. This week is for testing and refining, so that when it counts the thing already works.

## How this can help you win tickets

I have made a channel in the [concertje Discord](https://discord.gg/k9SMHQEQzA). Every time the app hears Marianne on Studio Brussel, it posts there. Join, turn on notifications for that channel, and you get the same alert I do, at the same moment.

Then open the Studio Brussel app and send your message. May the odds be in your favor. 💖
