# heartify-cli

A CLI tool to export and filter out your Spotify liked songs into playlists. 
With support for filters like ranges of date added, release date, genres, audio features, and more.


## What does it solve?

Around 2500 Liked songs in, I needed a way to organise the chaos without having to move away from 'liking' any more songs.
Hopefully, it's useful to more people out there with little time and a lot of liked songs :)

### What you can do

  ✔️ Export them to a playlist - you can now share your liked songs!
  
  ✔️ Filter by the year you liked them - make a 'My Top Songs 2023' playlist, for example
  
  ✔️ Filter by genre(s) to make genre-mixes out of your liked songs
  
  ✔️ Make monthly playlists - no more adding songs manually to monthly playlists, simply filter by ranges of dates added
  
  ✔️ Decade mixes - filter by release date
  
  ✔️ Filter by audio features - make a workout playlist of songs in a certain bpm range, for example

### No library size limits

There's no (known) limit to the number of songs Heartify can fetch, so bring along your massive library of 7000 liked songs (or more?)!
Just be prepared for it to take a bit longer with the measures in place to account for Spotify's rate limits.


## Getting Started

### Installation

Heartify is currently a work in progress, but you can install it by running:

```sh
npm install -g heartify-cli
```

### Authorisation

Run the following command from any directory, all data is stored locally where Heartify is installed. 
Then follow the instructions to authorise access to your Spotify library.

```sh
  heartify init

```

This command needs to be run just once, and you're logged in until you revoke permissions from your account page, 
logout, or until Spotify automatically revokes permissions from time-to-time (in which case, run `heartify init` again). 
Heartify uses the OAuth 2.0 Authorization Code with PKCE flow, and refreshes the access token automatically until it's revoked.

### Basic Examples

1. Export all liked songs to a playlist (replace 'My Liked Songs' for your playlist name, wrapped in quotes if it contains spaces)

   ```sh
    heartify export 'My Liked Songs'

   ```

   New playlists are not displayed on your profile by default. To display it on your profile, use the `--on-profile` flag or its short form `-p`

   ```sh
   heartify export 'My Liked Songs' -p

   ```

1. Export your liked songs from a specific year (2023 in the example). You can use `--added-from` or `-f`
   and `--added-to` or `-t`, but there's also a convenience option `--year` or `-Y` available, used here:

   ```sh
   heartify export 'Liked Songs 2023' -Y 2023

   ```

1. Filter by genre: There are several filters available, and one of them is `genre`.
   To see all the genres detected in your liked songs that you can filter by, run

   ```sh
   heartify show-genres

   ```

    > Note:
    > As of now, you need to have run at least one `export` command before running `show-genres` as it needs to fetch the
    > liked songs first while exporting to identify the genres. This will be fixed in a future update.
   

   Then pick a genre and filter (replace '\<genre name\>'):

   ```sh
   heartify export 'My <genre name> mix' --filter 'genre=<genre name>'

   ```

   You can also filter by multiple genres:

   ```sh
   heartify export 'My multi-genre mix' --filter 'genre=<genre name>' 'genre=<another genre name>'

   ```

   If genre names contain spaces or special characters, either wrap it in quotes, or wrap the entire field-value pair in quotes.
   For example, this command would make (a rather interesting) playlist out of songs which fall into at least one of
   the following genres: 'disco', 'conscious hip hop', 'k-indie', and 'escape room'

   ```sh
   heartify export 'My multi-genre mix' --filter genre=disco 'genre=conscious hip hop' genre='k-indie' genre='escape room'

   ```

1. Filter by custom range of date added using the `--added-from` or `-f` option, the `--added-to` or `-t` option, or both

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
   - `YYYY`: 2023, 2022 (NOTE: this is converted to midnight at the start of the year if it's a 'from' value, and the timestamp
     at the last second before midnight of January 1st if it's a 'to' value)

1. Filter by other features of the tracks, like date released, key, or tempo (see the list of supported features [here](#string-fields))

   ```sh
     heartify export 'Liked Songs, 120bpm' --filter tempo=120

   ```

1. Filter by ranges: DateTime filters and Number filters (TODO: link) support ranges. Ranges are written as `field=[from, to]`.
   Either the 'from' or the 'to' value can be omitted for a range unbounded on one side

   ```sh
     heartify export 'Liked Songs, 100-120bpm' --filter tempo=[100,120]

   ```

1. Combine options and filters

   ```sh
     heartify export 'Liked Songs 2023, 100-120bpm, danceable' -Y 2023 --filter tempo=[100,120] danceability=[0.7,]

   ```


## Detailed Docs (TODO)

### `--filter`

Filters are of the form `field=value` and accept any field from the list of supported fields below. 

The value can be either individual values like in `genre=disco` and `time_signature=4`, or ranges like
in `tempo=[100,120]` (only DateTime and Number fields accept ranges at the time of writing)

Ranges must have at least the start or the end specified. The search includes the end points.

```sh
# songs with tempo from 100 BPM to 120 BPM (both inclusive)
--filter tempo=[100,120]

# songs with tempo >= 100 BPM
--filter tempo=[100,]

# songs with tempo <= 120 BPM
--filter tempo=[,120]

```

If multiple filters are given for the same field, they are joined by OR in the search

```sh
# songs in the genres 'pop' or 'rock'
--filter genre=pop genre=rock

# songs released in the 60's or in the 80's
--filter release_date=[1960-01-01,1969-12-31] release_date=[1980-01-01,1989-12-31]

```

Filters for different fields are joined by AND

```sh
# songs in the genre 'pop' released in the year 1990
--filter genre=pop release_date=[1990-01-01,1990-12-31]

# songs by BTS released since 2020
--filter artist=BTS release_date=[2020-01-01,]

# the above search can also be written like this as 'from 2020' is parsed as 'from midnight of 2020-01-01'
--filter artist=BTS release_date=[2020,]

```

Filters do not need to be wrapped in quotes as long as they do not contain ANY spaces. 
Wrap them in single/double quotes when they contain whitespace.

```sh
# without spaces
--filter artist=BTS genre=k-pop release_date=[2016-01-01,2018-12-31]

# quotes can be around the whole field-value pair or just the string that has spaces
--filter artist='J. Cole' 'artist = BTS' 'artist = Epik High'

# quotes are needed if you prefer writing ranges with a space before/after the comma or the brackets
# the following filters are valid and return the same result:
--filter 'tempo=[60, 80]'
--filter tempo='[60, 80]'
--filter tempo=[60,' 80']
--filter tempo=[60, '80']
--filter tempo=['60', '80']
--filter 'tempo = [ 60, 80 ]'

```

### String fields
    
- `artist`
- `genre`

String fields accept only individual values (and not ranges).

For example, `--filter 'artist=[BTS,Epik High]'` would mean artists 'from BTS to Epik High' and is not a supported search

### DateTime fields

- `release_date`

### Number fields

These fields correspond to those returned by the Spotify Web API. The descriptions here are excerpts of the full descriptions,
which can be found in the [Spotify Web Api docs for Audio Features](https://developer.spotify.com/documentation/web-api/reference/get-audio-features).

| field              | description                                                                                                                                                                                                                                | range                 |
|--------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------|
| `danceability`     | How suitable a track is for dancing based on <br>a combination of musical elements including tempo, <br>rhythm stability, beat strength,and overall regularity                                                                             | 0.0 to 1.0<br>(float) |
| `energy`           | Represents a perceptual measure of intensity <br>and activity                                                                                                                                                                              | 0.0 to 1.0<br>(float) |
| `key`              | The key the track is in. <br>Integers map to pitches using standard Pitch Class <br>notation. E.g. 0 = C, 1 = C♯/D♭, 2 = D, and so on. <br>If no key was detected, the value is -1.                                                        | -1 to 11<br>(integer) |
| `loudness`         | The overall loudness of a track in decibels (dB).<br>Loudness values are averaged across the entire track and <br>are useful for comparing relative loudness of tracks                                                                     | -60 to 0<br>(float)   |
| `mode`             | Mode indicates the modality (major or minor) of a track.<br>Major is represented by 1 and minor is 0.                                                                                                                                      | 1 or 0<br>(integer)   |
| `speechiness`      | Detects the presence of spoken words in a track                                                                                                                                                                                            | 0.0 to 1.0<br>(float) |
| `acousticness`     | A confidence measure from 0.0 to 1.0 of whether the<br>track is acoustic                                                                                                                                                                   | 0.0 to 1.0<br>(float) |
| `instrumentalness` | Predicts whether a track contains no vocals                                                                                                                                                                                                | 0.0 to 1.0<br>(float) |
| `liveness`         | Detects the presence of an audience in the recording.<br>A value above 0.8 provides strong likelihood that the track<br>is live.                                                                                                           | 0.0 to 1.0<br>(float) |
| `valence`          | Tracks with high valence sound more positive<br>(e.g. happy, cheerful, euphoric), while tracks with <br>low valence sound more negative (e.g. sad, depressed, angry)                                                                       | 0.0 to 1.0<br>(float) |
| `tempo`            | The overall estimated tempo of a track in beats per minute (BPM)                                                                                                                                                                           | -<br>(float)          |
| `duration_ms`      | The duration of the track in milliseconds                                                                                                                                                                                                  | -<br>(integer)        |
| `time_signature`   | An estimated time signature. The time signature (meter) <br>is a notational convention to specify how many beats<br>are in each bar (or measure). The time signature ranges <br>from 3 to 7 indicating time signatures of "3/4", to "7/4". | 3 to 7<br>(integer)   |

</br>

---

## Feedback, suggestions, and bug reports welcome! 👐

This is a small project I've been making on the side as I'm learning JS.
Feel free to open an issue for a new feature you'd like to have, suggestions, bug reports, or anything else.

💜
