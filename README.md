# heartify-cli

A CLI tool to export and filter out your Spotify liked songs into playlists. With support for filters like ranges of date added, release date, genre, audio features, and more.

## What does it solve?

As someone with close to 2500 tracks in my Liked songs (rookie numbers, ik), I needed a way to organize them without needing to move away from 'Liking' more songs. Heartify attempts to solve this problem

- Share your liked songs - Export them to a playlist ☑️
- Make a 'My Top Songs 2023' playlist - Filter by the year you liked them ☑️
- Make genre-mixes out of your liked songs - Filter by genre(s) ☑️
- Make monthly playlists - No more adding songs manually to monthly playlists, simply filter by ranges of dates added ☑️
- Decade mixes - Filter by release date ☑️

...and more

## Getting Started

### Installation

Heartify is currently a work in progress, but you can install it here:

```sh
npm install -g heartify-cli
```

### Authorization

Run the following command from any directory, all data is stored locally where heartify is installed. Then follow the instrcuctions to authorise access to your Spotify library.

```sh
  heartify init

```

This command needs to be run just once, and you're logged in until you revoke permissions from your account page, logout, or until Spotify automatically revokes permissions from time-to-time (in which case, run `heartify init` again). Heartify uses the OAuth 2.0 Authorization Code with PKCE flow, and refreshes the access token automatically until it's revoked.

### Basic Examples

1. Export all liked songs to a playlist (replace 'My Liked Songs' for your playlist name, wrapped in quotes if it contains spaces)

   ```sh
    heartify export 'My Liked Songs'

   ```

   New playlists are not displayed on your profile by default. To display it on your profile, use the `--on-profile` flag or its short form `-p`

   ```sh
   heartify export 'My Liked Songs' -p

   ```

2. Export your liked songs from a specific year (2023 in the example). You can use `--added-from` or `-f` and `--added-to` or `-t`, but there's also a convenience option `--year` or `-Y` available, used here:

   ```sh
   heartify export 'Liked Songs 2023' -Y 2023

   ```

3. Filter by genre: There are several filters available, and one of them is `genre`. To see all the genres detected in your liked songs that you can filter by, run

   ```sh
   heartify show-genres

   ```

   Then pick a genre and filter (replace '\<genre name\>'):

   ```sh
   heartify export 'My <genre name> mix' --filter 'genre=<genre name>'

   ```

   You can also filter by multiple genres:

   ```sh
   heartify export 'My multi-genre mix' --filter 'genre=<genre name>' 'genre=<another genre name>'

   ```

   If genre names contain spaces or special characters, either wrap it in quotes, or wrap the entire field-value pair in quotes. For example, this command would make (a rather interesting) playlist out of songs which fall into at least one of the following genres: 'disco', 'conscious hip hop', 'k-indie', and 'escape room'

   ```sh
   heartify export 'My multi-genre mix' --filter genre=disco 'genre=conscious hip hop' genre='k-indie' genre='escape room'

   ```

4. Filter by custom range of date added using the `--added-from` or `-f` option, the `--added-to` or `-t` option, or both

   ```sh
   heartify export 'Liked Songs, November 2023' -f 2023-11-01 -t 2023-11-30

   ```

   ```sh
   heartify export 'Liked Songs from July 1st 2023 onwards' -f 2023-07-01

   ```

   Some things to keep in mind about the dates:

   - Dates for the start of the range (the 'from' values) are converted to the timestamp at midnight at the start of the day
   - Dates for the end of the range (the 'to' values) are converted to the timestamp at the last second before midnight at the end of the day
   - Dates are taken with reference to the user's current time zone (machine time zone). They're internally converted to UTC, but respect time zones.

   Valid date formats include:

   - `YYYYMMDD`: 20230101, 20230730
   - `YYYY-MM-DD`: 2023-01-01, 2023-07-30
   - `YYYY`: 2023, 2022 (NOTE: this is converted to midnight at the start of the year if it's a 'from' value, and the timestamp at the last second before midnight of January 1st if it's a 'to' value)

5. Filter by other features of the tracks, like date released, key, or tempo (Full list at TODO)

   ```sh
     heartify export 'Liked Songs, 120bpm' --filter tempo=120

   ```

6. Filter by ranges: DateTime filters and Number filters (TODO: link) support ranges. Ranges are written as `field=[from, to]`. Either the 'from' or the 'to' value can be omitted for a range unbounded on one side

   ```sh
     heartify export 'Liked Songs, 100-120bpm' --filter tempo=[100,120]

   ```

7. Combine options and filters

   ```sh
     heartify export 'Liked Songs 2023, 100-120bpm, danceable' -Y 2023 --filter tempo=[100,120] danceability=[0.7,]

   ```

## TODO: Detailed Docs
