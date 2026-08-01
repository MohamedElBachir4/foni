/**
 * TEMPORARY production entry — Next.js with optional diagnostic request logging.
 * Transparent when DIAGNOSTIC_REQUEST_LOG=0.
 * When enabled (default in production unless explicitly disabled), logs "/", "/_next/*",
 * and proxied API paths that hit this process to logs/diagnostic-requests.log
 */
const { createServer } = require("http");
const { parse } = require("url");
const path = require("path");
const next = require("next");
const {
  isDiagnosticEnabled,
  attachDiagnosticRequestLog,
} = require("./lib/diagnosticRequestLog.cjs");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);
const baseDir = __dirname;

/** On in production by default; set DIAGNOSTIC_REQUEST_LOG=0 to disable */
const diagDefaultOn = process.env.NODE_ENV === "production";
const diagOn = isDiagnosticEnabled(diagDefaultOn);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer(async (req, res) => {
      try {
        if (diagOn) {
          attachDiagnosticRequestLog(req, res, {
            baseDir,
            defaultOn: diagDefaultOn,
            source: "next",
          });
        }
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error("[diagnostic-server] handler error:", err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end("internal server error");
        }
      }
    }).listen(port, hostname, () => {
      console.log(
        `[foni-frontend] ready on http://${hostname}:${port} diagnostic=${diagOn ? "ON" : "off"}`
      );
      if (diagOn) {
        console.log(
          `[foni-frontend] TEMP diagnostic log → ${path.join(baseDir, "logs", "diagnostic-requests.log")}`
        );
      }
    });
  })
  .catch((err) => {
    console.error("[diagnostic-server] failed to start:", err);
    process.exit(1);
  });
