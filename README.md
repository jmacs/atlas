# Atlas

A web app for managing and automating tasks on my Unraid server.

## Local setup

Create a `.env` file in the repository root:

```dotenv
NODE_ENV=development
ATLAS_APPDATA_DIR=.local/
ATLAS_MOVIES_DIR=/path/to/movies
ATLAS_BOOKS_DIR=/path/to/books

# Optional: disable authentication during local development.
ATLAS_AUTH_BYPASS=false
```

### Authentication

Create the appdata directory if it does not already exist:

```shell
mkdir -p .local
```

Create `settings.json` in the appdata directory. With the local configuration above, its path is `.local/settings.json`:

```json
{
  "auth": {
    "username": "admin",
    "password": "your-unique-password"
  }
}
```

Atlas reads this file at startup. Restart Atlas after changing the credentials.

Authentication can be disabled locally by setting `ATLAS_AUTH_BYPASS=true`.
The bypass only works when `NODE_ENV=development`; Atlas refuses to start with it enabled in any other environment.

Session cookies automatically use the `Secure` attribute for direct HTTPS requests or when a reverse proxy sends `X-Forwarded-Proto: https`. Direct HTTP requests receive an HTTP-compatible session cookie.
