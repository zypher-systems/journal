# Security

journal holds people's private writing, so security reports are welcome and taken seriously.

## Reporting a vulnerability

Please don't open a public issue. Report it privately through GitHub: on this repository's **Security** tab, choose **Report a vulnerability**. Include what you found, how to reproduce it, and the version (the image tag or commit) you tested.

You'll get an acknowledgement within a week. Fixes for serious issues ship as a patch release, marked critical in its [release notes](docs/releases), and the advisory is published once people have had a chance to upgrade.

## Supported versions

Only the latest release gets fixes. Upgrade with `docker compose pull && docker compose up -d`.

## Deployment notes

- Set a strong `POSTGRES_PASSWORD`; compose refuses to start without one.
- `ORIGIN` must be the address people use; sign-in forms are checked against it.
- Serving beyond your LAN: put it behind HTTPS (see the README), then set `COOKIE_SECURE=true` and `ADDRESS_HEADER`.
