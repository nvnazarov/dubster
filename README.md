# Dubster

_Dubster_ is a web application where users dub clips from their favourite
movies, series, animations, and other videos.

## Features

- A user can search available clips by title, author, number of roles
or rating in the _clips library_.
- A user can upload their own clip, which requires making necessary
annotations (roles, segments, lines).
- A group of users can dub a clip together, one user per role.
- Dubster automatically grades completed dubs based on how similar they
are to the original.

## Development

Execute `make dev` in the project's root directory to deploy a Docker
Compose development environment. The application is then accessible at
`localhost:3000`. Modifications applied to client's or server's source
code can be observerd live after a short delay.
