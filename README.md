<!--- This is the short README for npm, see the full README in .github/ -->

# heartify-cli

A CLI tool to export and filter out your Spotify liked songs into playlists.
With support for filters like ranges of date added, release date, genres, audio features, and more.

## What does it solve?

The Liked Songs list on Spotify can quickly grow into chaos the more you use it. 
As time goes by, it becomes increasingly harder to find songs to fit the moment, while keeping all of your liked songs in one place. It's also easier to forget your older songs as Spotify's shuffle keeps playing the same 50 songs over and over again. And sometimes, it's just nicer if there was a way to keep adding songs, while also being able to filter them out occasionally into playlists of just your favourites that fit the mood. 

That's where Heartify comes in, so you can create fine-tuned playlists with just the songs you like, and share them 🎉 

One step from chaos -> organised chaos 🗃️

### Features

✔️ Export to a playlist to share your liked songs

✔️ Filter by the year you liked the song - make a 'My Top Songs 2023' playlist, for example

✔️ Filter by genre(s) to make genre-mixes out of your liked songs

✔️ Make monthly playlists - no more adding songs manually to monthly playlists, simply filter by ranges of dates added

✔️ Decade mixes - filter by release date

✔️ Filter by audio features - make a workout playlist of songs in a certain bpm range, for example

### No library size limits

There's no (known) limit to the number of songs Heartify can fetch, so bring along your massive library of 7000 liked songs (or more?)!
Just be prepared for it to take a bit longer with the measures in place to account for Spotify's rate limits.

### Fully local

Heartify collects no data. All data is stored locally on your device where heartify is installed, and can be deleted by running `heartify logout`. You can also revoke access at any time from your Spotify account page at Spotify Account > Security and privacy > Manage apps.

## Quickstart

```sh
# install
npm install -g heartify-cli

# authorise access, and fetch liked songs and metadata
heartify init

# create your first playlist!
# This command exports all songs to a playlist
# (-p, short for --on-profile, optionally adds it to your profile)
heartify export 'My Liked Songs' -p

# export just the songs liked in 2023
heartify export 'Liked Songs 2023' -Y 2023

# or the songs liked in any range of time
heartify export 'Liked Songs, November 2023' -f 2023-11-01 -t 2023-11-30

# see all genres identified
heartify show-genres

# make a genre-mix (replace <genre name> with a genre of your choice)
heartify export 'My <genre name> mix' --filter 'genre=<genre name>'

# make a multi-genre mix
heartify export 'My multi-genre mix' --filter 'genre=<genre name>' 'genre=<another genre name>'

# filter by properties of the track - like release date, audio features (tempo, key, etc)
heartify export 'Liked Songs, 100-120bpm' --filter tempo=[100,120]

```

## Docs

Read the [full docs](https://github.com/Ak5cel/heartify-cli#readme) on GitHub.

💜
