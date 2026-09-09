# Dubster's Design

## Terminology

- A _user_ is a person that is using Dubster's website.
- A _clip_ is a video that is available on Dubster for voicing. A clip consists of at least one
_segment_.
- A _segment_ is a contiguous piece of a clip that can be voiced
independently of any other segment. Segments can overlap. Each
segment is assosiated with one _role_ and one _line_.
- A _role_ is a specific entity in a clip that produces a sound or speaks.
- A _line_ is a phrase or a transcription of a sound that an entity in a clip is making. A user should
strive to replicate the sound as close as possible to the original.
- A _library_ is a collection of clips uploaded by users.
- A _recording_ is an audio clip recorded by a user.

## Functional Requirements

- A user can upload a clip. To upload a clip, a user chooses a video on their computer and
cuts it into segments. For each segment, a role and a line are then defined. Cutting, role
and line selection is done via the user interface the website provides.
- A user can explore clips in the library.
- A user can _voice_ a clip from the library. To voice a clip, a user iterates through all segments
in any order, recording their voice acting (the user should strive to be as close to the original audio
as possible - that is the point of the game). The user can re-record a segment or watch the original
video fragment. After the last segment is voiced, the user can watch the clip with the original audio
replaced with their own recording.
- A group of users can voice a clip cooperatively. Each user selects a set of available roles and voices
them only. After all users have voiced their last segments, the resulting clip is shown to everyone.
- Dubster implements an automatic grading system. The system gives every user a grade based off how close
their voice acting was to the original.

## Assumptions about the System

Users:

- Registered users: 100k
- MAU (monthly active users): 20k (20% of registered)
- DAU (daily active users): 2k (10% of MAU)
- Peak concurrent users: 200/s

Voicing:

- Max cooperative session duration: 1h
- Peek concurrent cooperative sessions: 200
- Recordings / day: 500
- Avg recording (user audio only) size: 200 KB

Clips:

- Clips in the library: 10k
- Max clip size: 200 MB
- Avg clip size: 60 MB
- Clip storage: 1.5 TB
- Max clip duration: 2m
- Avg clip duration: 30s
- Max segment duration: 10s
- Max segments / clip: 100

## Video and Audio Formats

In the world of digital video and audio, we have compressed (lossy) and uncompressed formats.
While Dubster is not aiming to provide the greatest video and audio quality, it is still
searching a compromise between quality and size for the best user experience.

The main formats that Dubster uses are MP4 (original clip) and MP3 (user audio recordings).
These formats are amongst the most popular ones. The nice property of these formats is that
they can be tweaked to provide a better quality to size ratio.

## Storage

The clips uploaded by users should be stored permanently in an object store, which is the
better option for storing blobs like video and audio files.

However, the metadata of the uploaded clip, i.e. the list of its segments, etc., shoud
be stored somewhere else for fast retrieval (to show info in search results, for example).
A relational database like PostgreSQL would be great for this purpose. We can store clips, segments, and
roles in different tables:

```sql
CREATE TABLE clips(
    id          UUID PRIMARY KEY,
    author_id   VARCHAR(255) NOT NULL,
    title       VARCHAR(512) NOT NULL,
    description VARCHAR(2056),
    duration_ms INTEGER
);
CREATE TABLE segments(
    id              UUID,
    clip_id         UUID NOT NULL REFERENCES clips(id),
    role_id         UUID NOT NULL REFERENCES roles(id),
    line            TEXT,
    begin_time_ms   INTEGER,
    end_time_ms     INTEGER
);
CREATE TABLE roles(
    id          UUID PRIMARY KEY,
    name        VARCHAR(64) NOT NULL,
    description VARCHAR(256)
);
```

The most common operation is retreiving a clip and related segments and roles. Thus, creating an index
on `clip.id`, `segments.clip_id` and `segments.role_id` columns will be beneficial. To enable efficient
search by clip title, we should consider creating a special GIN index on `clip.title` column. If a more
sophisticated search will be needed, we should consider other approaches or databases (ElasticSearch,
for example).

## Event-Driven Architecture

Many of the processes described in the later sections must be executed asynchronously in relation to the
user's actions. This is done to mitigate the risk of consuming all system resources at the moment of
maximum user activity. It also reduces the risk of long-running user requests ending up in a failure (because
we design the system in a way so that there are almost none long-running user requests).

User actions are creating new events in the system, and the system should react to this events, but
not necessarily exactly at the time they are appearing. This is known as the event-driven architecture (EDA).
You will see the descriptions of events and their handlers in the next sections.

## Creating and Uploading a Clip

TODO: write about how client side looks like.

The most reliable way to upload a clip would be to upload the small part first - the clip's metadata - and then to
upload the clip directly to the object store bypassing the metadata service. This will lower the load on the
service. Moreover, it would be easier to show uploading progress on the client side.

A user calls a special HTTP route `/clips/:id/upload` to get a signed URL for the upload. After uploading the clip,
they call `/clips/:id/uploaded` to tell Dubster that the clip was uploaded. This creates a new event: `CLIP_UPLOADED`. Eventually, Dubster verifies the upload and marks the clip as ready for use. If verification fails, the clip will
never be marked until the user uploads a valid clip.

## Downloading a Clip. Caching

...

## Voicing a Clip

...

## Cooperative Voicing

...
