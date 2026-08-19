---
layout: article
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

The app listens to the sound itself. `ffmpeg` pulls in the stream, and once a second the last six seconds get turned into a fingerprint, a compact summary of what that bit of audio sounds like. The single I dragged in gets the same treatment once.

Comparing two fingerprints gives you one number, the difference score. Identical audio scores near zero. Two unrelated songs score near a half. Everything after this is about picking the right cutoff.

The single is fingerprinted three times, at normal speed and slightly either side of it. Radio stations quietly speed music up to fit more into an hour, and a fingerprint at the wrong speed does not match.

Two windows in a row under the cutoff and it fires. A Discord webhook, a macOS notification, and a twelve minute quiet period so one play does not produce forty alerts.

## The first thing it caught was the wrong song

I set the cutoff at 0.28, meaning a six second window had to be less than 28 percent different from the single to count as a match. Then I armed it and went to do something else. It fired within the hour, on a track that was very much not Marianne.

The app keeps the last forty-five seconds of audio in memory at all times and writes it to a file whenever something fires. That was originally there for the jingles, the bit the station plays just before a song, so I can fingerprint those too and get an even earlier warning. It turned out to be just as useful here. Instead of a false positive I could not investigate, I had a WAV file of exactly what fooled it.

Replaying it told me two things. The cutoff was too generous, so it moved to 0.18. And a real match moves forward through the song as time passes, while the false one jumped backwards, so consecutive matches now have to agree on where in the song they are or the streak resets.

The imposter no longer produces a single qualifying window.

## Sending the message

When Marianne is detected, a second window inside the app comes to the front with the VRT MAX chat open and my message already typed into the box. All that is left is pressing send.

## Where it stands

The app runs. The detection logic has tests pinning the exact false positive that caused all this, and everything is verified against real recordings rather than my assumptions.

It has already caught a real play. Marianne came on and the app fired five seconds in, and the recording it saved holds the jingle the station plays just before the song. Fingerprinting that jingle is the next thing on the list, because it would buy another few seconds.

![The marianne watch app listening to the Studio Brussel stream, showing a match at 13:14:44 with a score of 0.152, five seconds into the track](/assets/images/articles/marianne-watch-app.jpg)
*A real catch. Five seconds into the song, score 0.152, clip saved.*

The competition itself starts next week. This week is for testing and refining, so that when it counts the thing already works.

## How this can help you win tickets

I have made a channel in the [concertje Discord](https://discord.gg/k9SMHQEQzA). Every time the app hears Marianne on Studio Brussel, it posts there. Join, turn on notifications for that channel, and you get the same alert I do, at the same moment.

Then open the Studio Brussel app and send your message. May the odds be in your favor. 💖
