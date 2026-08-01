/**
 * TEMPORARY — same diagnostic logger for Next.js custom server.
 * Copied logic kept local so frontend deploy does not depend on server/ package.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SLOW_MS = 10_000;
const VERY_SLOW_MS = 30_000;

function isDiagnosticEnabled(defaultOn = false) {
  const v = String(process.env.DIAGNOSTIC_REQUEST_LOG ?? "").trim().toLowerCase();
  if (v === "0" || v === "false" || v === "off" || v === "no") return false;
  if (v === "1" || v === "true" || v === "on" || v === "yes") return true;
  return defaultOn;
}

function resolveLogFile(baseDir) {
  const fromEnv = String(process.env.DIAGNOSTIC_REQUEST_LOG_FILE || "").trim();
  if (fromEnv) return fromEnv;
  return path.join(baseDir, "logs", "diagnostic-requests.log");
}

function ensureLogDir(filePath) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  } catch {
    // ignore
  }
}

function shouldLogPath(pathname) {
  if (!pathname) return false;
  const p = pathname.split("?")[0] || "";
  if (p === "/") return true;
  if (p.startsWith("/api/home/")) return true;
  if (p.startsWith("/_next/")) return true;
  if (p === "/api/brands") return true;
  if (p === "/api/contact-settings/public") return true;
  return false;
}

function getPathname(req) {
  try {
    const raw = req.url || "/";
    return raw.split("?")[0] || "/";
  } catch {
    return "/";
  }
}

function getFullUrl(req) {
  try {
    return String(req.url || "/");
  } catch {
    return "/";
  }
}

function getRemoteIp(req) {
  try {
    const xff = req.headers && req.headers["x-forwarded-for"];
    if (typeof xff === "string" && xff.trim()) {
      return xff.split(",")[0].trim();
    }
    if (Array.isArray(xff) && xff[0]) return String(xff[0]).trim();
    if (req.socket && req.socket.remoteAddress) return String(req.socket.remoteAddress);
  } catch {
    // ignore
  }
  return "";
}

function appendLogLine(filePath, payload) {
  const line = JSON.stringify(payload) + "\n";
  try {
    fs.appendFile(filePath, line, (err) => {
      if (err) console.error("[diagnostic-request-log] write failed:", err.message);
    });
  } catch (err) {
    console.error("[diagnostic-request-log] write failed:", err && err.message);
  }
}

function attachDiagnosticRequestLog(req, res, options = {}) {
  const baseDir = options.baseDir || process.cwd();
  const defaultOn = Boolean(options.defaultOn);
  if (!isDiagnosticEnabled(defaultOn)) return false;

  const pathname = options.pathname || getPathname(req);
  if (!shouldLogPath(pathname)) return false;

  const logFile = resolveLogFile(baseDir);
  ensureLogDir(logFile);

  const requestId =
    (typeof crypto.randomUUID === "function" && crypto.randomUUID()) ||
    `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const startMs = Date.now();
  const startIso = new Date(startMs).toISOString();
  const userAgent = String((req.headers && req.headers["user-agent"]) || "");
  const method = String(req.method || "GET");
  const url = getFullUrl(req);
  const remoteIp = getRemoteIp(req);
  const source = options.source || "next";

  let responseCompleted = false;
  let headersSentLogged = false;
  let connectionClosedLogged = false;
  let requestAbortedLogged = false;
  let responseFinishedLogged = false;
  let slowLogged = false;
  let verySlowLogged = false;

  const common = () => ({
    tag: "DIAG",
    requestId,
    timestamp: new Date().toISOString(),
    method,
    url,
    path: pathname,
    statusCode: Number(res.statusCode) || 0,
    durationMs: Date.now() - startMs,
    userAgent,
    remoteIp,
    headersSent: Boolean(res.headersSent),
    responseCompleted,
    source,
  });

  const logEvent = (event, extra = {}) => {
    appendLogLine(logFile, {
      ...common(),
      event,
      ...extra,
    });
  };

  logEvent("REQUEST_STARTED", {
    message: "Request started",
    requestStart: startIso,
    requestStartMs: startMs,
  });

  const markHeadersSent = () => {
    if (headersSentLogged || !res.headersSent) return;
    headersSentLogged = true;
    logEvent("HEADERS_SENT", {
      message: "Headers sent",
    });
  };

  const origWriteHead = res.writeHead;
  if (typeof origWriteHead === "function") {
    res.writeHead = function diagnosticWriteHead(...args) {
      const out = origWriteHead.apply(this, args);
      try {
        markHeadersSent();
      } catch {
        // ignore
      }
      return out;
    };
  }

  const checkDurationTiers = () => {
    const durationMs = Date.now() - startMs;
    if (!verySlowLogged && durationMs > VERY_SLOW_MS) {
      verySlowLogged = true;
      slowLogged = true;
      logEvent("VERY_SLOW_REQUEST", {
        message: "VERY_SLOW_REQUEST (>30s)",
        durationMs,
      });
    } else if (!slowLogged && durationMs > SLOW_MS) {
      slowLogged = true;
      logEvent("SLOW_REQUEST", {
        message: "SLOW_REQUEST (>10s)",
        durationMs,
      });
    }
  };

  const slowTimer = setInterval(() => {
    try {
      checkDurationTiers();
    } catch {
      // ignore
    }
  }, 2_000);
  if (typeof slowTimer.unref === "function") slowTimer.unref();

  const stopSlowTimer = () => {
    clearInterval(slowTimer);
  };

  res.on("finish", () => {
    responseCompleted = true;
    markHeadersSent();
    stopSlowTimer();
    checkDurationTiers();
    if (!responseFinishedLogged) {
      responseFinishedLogged = true;
      logEvent("RESPONSE_FINISHED", {
        message: "Response finished",
        responseFinished: true,
      });
    }
  });

  res.on("close", () => {
    markHeadersSent();
    stopSlowTimer();
    checkDurationTiers();
    if (!connectionClosedLogged) {
      connectionClosedLogged = true;
      const abortedEarly = !responseCompleted;
      logEvent("CONNECTION_CLOSED", {
        message: "Connection closed",
        connectionClosed: true,
        responseCompleted,
        requestAborted: abortedEarly,
      });
      if (abortedEarly && !requestAbortedLogged) {
        requestAbortedLogged = true;
        logEvent("REQUEST_ABORTED", {
          message: "CLIENT ABORTED",
          requestAborted: true,
          clientDisconnected: true,
        });
      }
    }
  });

  req.on("aborted", () => {
    stopSlowTimer();
    checkDurationTiers();
    if (!requestAbortedLogged) {
      requestAbortedLogged = true;
      logEvent("REQUEST_ABORTED", {
        message: "CLIENT ABORTED",
        requestAborted: true,
        clientDisconnected: true,
      });
    }
  });

  return true;
}

module.exports = {
  isDiagnosticEnabled,
  shouldLogPath,
  attachDiagnosticRequestLog,
  SLOW_MS,
  VERY_SLOW_MS,
};
