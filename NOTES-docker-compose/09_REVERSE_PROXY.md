# Reverse Proxy (nginx) — What we changed, why, and full request flow

This note documents the reverse-proxy changes we made for the client application, why we made them, how the request flow works end-to-end, how caching/304 responses occur, and how to verify the proxy behavior.

## Quick summary
- File added: `NOTES/09_REVERSE_PROXY.md` (this document)
- Key nginx change: adjust `proxy_pass` so backend receives the expected URI
- Result: requests to `/api/...` will be forwarded to the backend without accidental path rewrites; protected endpoints will not be cached (avoid 304 surprises)

## What we changed (concrete)
Original nginx snippet (in `client/nginx.conf`):

```nginx
location /api/ {
    proxy_pass http://server:5000/;
    ...
}
```

Problem: the trailing slash on `proxy_pass` causes nginx to replace the matched prefix (`/api/`) with `/` when proxying. A client request to:

- `/api/auth/login` → proxied as `/auth/login`

If the backend defines routes under `/api/*`, it will return 404.

Recommended change (preserve original client URI after `/api`):

```nginx
location /api/ {
    proxy_pass http://server:5000;
    ...
}
```

Behavior differences:
- `proxy_pass http://server:5000/;` rewrites `/api/foo` → `/foo` (removes `/api`).
- `proxy_pass http://server:5000;` forwards the full request URI after the location prefix is appended (so `/api/foo` → `/api/foo` on the backend).

Choose the one that matches how your backend routes are declared.

## Why the rewrite happens (brief nginx explanation)
- nginx's `location` + `proxy_pass` rules treat a trailing slash on the `proxy_pass` URL specially:
  - If `proxy_pass` includes a URI part (trailing slash), nginx replaces the part matched by `location` with that URI.
  - If `proxy_pass` has no trailing slash, nginx appends the original request URI to the upstream host.
- See nginx docs for `proxy_pass` for more formal details.

## Full request flow (end-to-end)
1. Client (browser) issues an HTTP request to the public host, e.g.:
   - `POST http://139.59.6.209:3001/api/auth/login`
2. nginx (listening on port 80 inside container or port 3001 externally) matches `location /api/`.
3. nginx rewrites/forwards the request to upstream:
   - If `proxy_pass http://server:5000/;` → backend request path becomes `/auth/login`
   - If `proxy_pass http://server:5000;` → backend receives `/api/auth/login`
4. Backend receives request (Express/Node) and matches route handlers.
5. Backend responds. nginx forwards the response back to client.

Notes about Docker:
- The hostname `server` in `proxy_pass` resolves when nginx runs in the same Docker network as the `server` service defined in `docker-compose.yml`. If nginx is not inside that network, replace `server` with a reachable host (like `localhost:5000` on host networking) or ensure proper network setup.

## Caching, 304 Not Modified, and why you saw 304
- A `304 Not Modified` means the client sent a conditional request header (`If-None-Match` or `If-Modified-Since`) and the server/proxy determined the resource has not changed.
- Two places can cause/influence this:
  1. The backend sets `ETag` or `Last-Modified`, causing the client to send conditional requests.
  2. A proxy (nginx or other caching layer) sets or honors caching headers, returning 304.
- For protected API endpoints, caching is usually undesirable because they return user-specific data and may require fresh tokens/authorization.

How to confirm where 304 came from:
- In browser DevTools → Network → select the request:
  - Check Request headers for `If-None-Match` or `If-Modified-Since`.
  - Check Response headers for `ETag`, `Last-Modified`, `Cache-Control`, `Age`, `Via`.
  - `Via` or `Age` often indicate caching/proxy involvement.
- Use curl to inspect headers:

```bash
curl -I http://139.59.6.209:3001/api/protected/user
```

If the backend adds `ETag` or `Cache-Control: public, max-age=...`, that explains client conditional requests.

## Recommended fixes to avoid 304 for protected endpoints
- Server-side (preferred): mark API responses non-cacheable
  - Per-route (Express):

```js
app.get('/api/protected/user', (req, res) => {
  res.set('Cache-Control', 'no-store');
  // send user data...
});
```

  - Globally for API:

```js
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
```

  - Or disable ETag if you don't want conditional requests:
    ```js
    app.disable('etag');
    ```

- Client-side (force fresh fetch for critical endpoints):
  - fetch:
    ```js
    fetch('/api/protected/user', { cache: 'no-store' });
    ```
  - axios:
    ```js
    axios.get('/api/protected/user', { headers: { 'Cache-Control': 'no-store' } });
    ```

- nginx layer: ensure it doesn't enable proxy caching for `/api` and that it forwards cache-control headers from backend (or sets `no-store`). Example:

```nginx
location /api/ {
    proxy_pass http://server:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    # Do not cache API responses
    proxy_set_header Cache-Control '';
    add_header Cache-Control 'no-store';
}
```

## Verification steps (curl + expected behavior)
1. Confirm nginx forwards paths correctly:
   - With the recommended `proxy_pass http://server:5000;` change:
     ```bash
     curl -v http://139.59.6.209:3001/api/auth/login -X POST -d '{"u":"a","p":"b"}' -H "Content-Type: application/json"
     ```
     - Expectation: backend receives `/api/auth/login` and responds accordingly (200 or 401, not 404).
2. Inspect headers for caching:
   ```bash
   curl -I http://139.59.6.209:3001/api/protected/user
   ```
   - Expectation: `Cache-Control: no-store` or no `ETag`/`Last-Modified` when fixed.
3. Simulate conditional request to reproduce 304 (if backend still sets ETag):
   ```bash
   curl -i -H "If-None-Match: \"SOME_ETAG\"" http://139.59.6.209:3001/api/protected/user
   ```
   - Expectation: returns 304 only when resource unchanged; after applying `no-store`, client should not rely on conditional requests.

## Troubleshooting checklist
- If you still see 404 on `/api/auth/login`:
  - Re-check `proxy_pass` trailing slash behavior.
  - Log actual backend path received (add temporary middleware in Express that logs `req.path`).
  - Ensure nginx resolves upstream `server` (run `curl http://server:5000` from the nginx container).
- If you still see 304 on protected endpoints:
  - Inspect response headers from backend (is backend setting `ETag` or `Cache-Control`?).
  - Make sure nginx isn't adding caching rules for `/api`.
  - Use `curl -I` to validate headers and isolate whether nginx or backend added them.

## Rollback and minimal safe config
- If a quick rollback is needed, restore the original `client/nginx.conf` from version control. For minimal change that fixes the 404 issue, only change the `proxy_pass` line (remove trailing slash) and reload nginx.

## References and further reading
- nginx `proxy_pass` docs — behavior with/without trailing slash
- HTTP caching and conditional requests (`ETag`, `If-None-Match`, `If-Modified-Since`)

---
End of note.

