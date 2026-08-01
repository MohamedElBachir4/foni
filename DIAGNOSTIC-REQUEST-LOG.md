# TEMPORARY production diagnostic request logger
#
# Logs request lifecycle for:
#   / , /api/home/* , /_next/* , /api/brands , /api/contact-settings/public
#
## Enable / disable
# Enabled by default when NODE_ENV=production.
# Disable:  DIAGNOSTIC_REQUEST_LOG=0
# Force on: DIAGNOSTIC_REQUEST_LOG=1
#
## Log files
# Frontend: foni/logs/diagnostic-requests.log  (or DIAGNOSTIC_REQUEST_LOG_FILE)
# Backend:  server/logs/diagnostic-requests.log
#
## Events (JSON lines)
# REQUEST_STARTED | HEADERS_SENT | RESPONSE_FINISHED | CONNECTION_CLOSED | REQUEST_ABORTED
# SLOW_REQUEST (>10s) | VERY_SLOW_REQUEST (>30s)
#
## Fields (every event)
# requestId, timestamp, method, url, statusCode, durationMs, userAgent, remoteIp
#
## Remove later
# - server/middleware/diagnosticRequestLog.js + mount in index.js
# - foni/lib/diagnosticRequestLog.cjs + diagnostic-server.js
# - restore package.json "start": "next start"
