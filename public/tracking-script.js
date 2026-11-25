/*
 * Analytica tracking script. Add to a page with:
 *   <script defer data-domain="example.com" src="https://analytica-phi.vercel.app/tracking-script.js"></script>
 *
 * Sends a `session_start` when a visitor's session begins (a session ends after
 * 10 minutes without a page view), a `pageview` for the first page and every
 * client-side navigation, a `session_end` when an expired session is replaced, and
 * `engagement` with the time a page was visible and focused. Every request carries
 * the session id.
 *
 * Clicks on links to other sites (`outbound_click`) and to downloadable files
 * (`file_download`) are reported with the link's URL minus query and fragment,
 * without delaying navigation. Optional attributes on the script tag:
 *   data-outbound-links="false"   don't report outbound links
 *   data-file-downloads="false"   don't report downloads
 *   data-file-types="zip,dmg"     replace the default file extensions
 *   data-add-file-types="xyz"     add to them
 *   data-web-vitals="false"       don't report Core Web Vitals
 *   data-errors="false"           don't report JavaScript errors
 *
 * Core Web Vitals (LCP, INP, CLS, FCP, TTFB) of the page load are sent once as
 * `web_vitals` when the page is first hidden.
 *
 * Uncaught errors and unhandled promise rejections are reported as `js_error`
 * with their name, message and stack (each distinct one once, at most 10 per page).
 * Custom calls:
 *   window.your_tracking("event_name", { callback: fn })
 * Calls made before this script loads can be queued in window.your_tracking.q.
 */
(function () {
  "use strict";

  var ENDPOINT = "https://analytica-phi.vercel.app/api/track";
  var SESSION_MS = 10 * 60 * 1000;
  var KEY_ID = "session_id";
  var KEY_EXPIRES = "session_expiration_timestamp";
  var MIN_ENGAGED_MS = 1000; // shorter stretches wait for the next send

  var script = document.currentScript;
  var domain = script && script.getAttribute("data-domain");
  var query = new URLSearchParams(window.location.search);
  var source = query.get("utm") || query.get("ref");
  var ua = navigator.userAgent;

  function operatingSystem() {
    if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
    if (/Android/.test(ua)) return "Android";
    if (/Windows/.test(ua)) return "Windows";
    if (/Mac OS/.test(ua)) return "MacOS";
    if (/Linux/.test(ua)) return "Linux";
    return "Unknown";
  }

  function deviceType() {
    if (/tablet|ipad|playbook|silk|android(?!.*mobi)/i.test(ua)) return "tablet";
    if (/Mobi|iPhone|iPod|IEMobile|BlackBerry|Kindle|Opera Mini/i.test(ua)) return "mobile";
    // Small screens without a touch user agent are most likely laptops.
    return screen.width <= 1366 && screen.height <= 768 ? "laptop" : "desktop";
  }

  function browserName() {
    // Order matters: Edge and Opera user agents also mention Chrome, and Chrome mentions Safari.
    if (/Edg\//.test(ua)) return "Edge";
    if (/OPR\/|Opera/.test(ua)) return "Opera";
    if (/Firefox\//.test(ua)) return "Firefox";
    if (/Chrome\//.test(ua)) return "Chrome";
    if (/Safari\//.test(ua)) return "Safari";
    return "Unknown";
  }

  var context = {
    domain: domain,
    source: source,
    operatingSystem: operatingSystem(),
    deviceType: deviceType(),
    browserName: browserName(),
  };

  // localStorage can be blocked (privacy settings, sandboxed frames); fall back to
  // memory so this page still has a session id.
  var memory = {};
  function load(key) {
    var value = null;
    try {
      value = localStorage.getItem(key);
    } catch {
      // blocked: memory has the value
    }
    return value !== null ? value : memory[key] || null;
  }
  function save(key, value) {
    memory[key] = value;
    try {
      localStorage.setItem(key, value);
    } catch {
      // blocked: memory has the value
    }
  }

  var sessionId = load(KEY_ID);

  function post(payload, options) {
    try {
      var request = new XMLHttpRequest();
      request.open("POST", ENDPOINT, true);
      request.setRequestHeader("Content-Type", "application/json");
      request.onloadend = function () {
        if (options && typeof options.callback === "function") options.callback();
      };
      request.send(JSON.stringify(payload));
    } catch (error) {
      console.error("Analytica: could not send event", error);
    }
  }

  function send(event, options) {
    post(Object.assign({ event: event, url: window.location.href, sessionId: sessionId }, context), options);
  }

  // For sends while the page may be unloading: keepalive outlives the page, and a
  // text/plain body skips the CORS preflight.
  function postKeepalive(payload) {
    if (typeof fetch !== "function") return post(payload);
    try {
      fetch(ENDPOINT, {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload),
      }).catch(function (error) {
        console.error("Analytica: could not send event", error);
      });
    } catch (error) {
      console.error("Analytica: could not send event", error);
    }
  }

  function randomId() {
    var bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return "session-" + Array.from(bytes, function (b) {
      return b.toString(16).padStart(2, "0");
    }).join("");
  }

  // Called before every page view: replaces a missing or expired session, then
  // pushes the expiry 10 minutes ahead.
  function ensureSession() {
    var id = load(KEY_ID);
    var expires = Number(load(KEY_EXPIRES));
    if (id && expires && Date.now() >= expires) {
      post(Object.assign({ event: "session_end", url: window.location.href, sessionId: id }, context));
      id = null;
    }
    if (!id || !expires) {
      sessionId = randomId();
      save(KEY_ID, sessionId);
      send("session_start");
    } else {
      sessionId = id;
    }
    save(KEY_EXPIRES, String(Date.now() + SESSION_MS));
  }

  // Engagement: time the current page view is visible and focused, sent in pieces.
  var current = null; // { url, sessionId } of the page view being timed
  var engagedMs = 0;
  var runningSince = null;

  function isActive() {
    return document.visibilityState === "visible" && document.hasFocus();
  }
  function resume() {
    if (current && runningSince === null && isActive()) runningSince = Date.now();
  }
  function pause() {
    if (runningSince !== null) {
      engagedMs += Date.now() - runningSince;
      runningSince = null;
    }
  }
  function flush() {
    pause();
    if (current && engagedMs >= MIN_ENGAGED_MS) {
      postKeepalive(
        Object.assign({}, context, {
          event: "engagement",
          url: current.url,
          sessionId: current.sessionId,
          engagedMs: Math.round(engagedMs),
        })
      );
      engagedMs = 0;
    }
    resume();
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flush();
    else resume();
  });
  window.addEventListener("pagehide", flush);
  window.addEventListener("blur", pause);
  window.addEventListener("focus", resume);

  // Outbound links and file downloads.
  var DEFAULT_FILE_TYPES =
    "pdf,doc,docx,xls,xlsx,ppt,pptx,csv,txt,rtf,zip,rar,7z,gz,tar,dmg,pkg,exe,msi,apk,mp3,wav,mp4,mov,avi,mkv";

  function attribute(name) {
    return script ? script.getAttribute(name) : null;
  }
  function extensionList(value) {
    return value
      .split(",")
      .map(function (type) {
        return type.trim().toLowerCase().replace(/^\./, "");
      })
      .filter(Boolean);
  }

  var trackOutbound = attribute("data-outbound-links") !== "false";
  var trackDownloads = attribute("data-file-downloads") !== "false";
  var fileTypes = extensionList(attribute("data-file-types") !== null ? attribute("data-file-types") : DEFAULT_FILE_TYPES).concat(
    extensionList(attribute("data-add-file-types") || "")
  );
  var lastLink = { key: "", at: 0 };

  // "www." doesn't make a different site; a subdomain or another port does.
  function siteOf(location) {
    return location.hostname.toLowerCase().replace(/^www\./, "") + ":" + location.port;
  }
  function closestLink(node) {
    for (; node && node !== document; node = node.parentNode) {
      if (node.tagName && /^(a|area)$/i.test(node.tagName) && node.getAttribute("href") !== null) return node;
    }
    return null;
  }
  function isFile(pathname) {
    var name = pathname.slice(pathname.lastIndexOf("/") + 1);
    var dot = name.lastIndexOf(".");
    return dot !== -1 && fileTypes.indexOf(name.slice(dot + 1).toLowerCase()) !== -1;
  }

  function onLinkClick(event) {
    try {
      if (event.type === "auxclick" && event.button !== 1) return; // middle click only
      var link = closestLink(event.target);
      if (!link) return;
      var target = new URL(link.getAttribute("href"), document.baseURI); // honors <base href>, like the browser
      if (target.protocol !== "http:" && target.protocol !== "https:") return;
      var targetUrl = target.protocol + "//" + target.host + target.pathname;
      if (targetUrl.length > 2048) return;

      var kind = null;
      if (siteOf(target) !== siteOf(window.location)) {
        if (trackOutbound) kind = "outbound_click";
      } else if (trackDownloads && (link.hasAttribute("download") || isFile(target.pathname))) {
        kind = "file_download";
      }
      if (!kind) return;

      var key = kind + " " + targetUrl;
      var now = Date.now();
      if (key === lastLink.key && now - lastLink.at < 1000) return; // double click
      lastLink = { key: key, at: now };
      postKeepalive(
        Object.assign({}, context, { event: kind, url: window.location.href, targetUrl: targetUrl, sessionId: sessionId })
      );
    } catch (error) {
      console.error("Analytica: could not send event", error);
    }
  }

  // Capture phase, so links whose own handlers stop propagation still count.
  if (domain && (trackOutbound || trackDownloads)) {
    document.addEventListener("click", onLinkClick, true);
    document.addEventListener("auxclick", onLinkClick, true);
  }

  // Core Web Vitals for this page load, measured with the browser's Performance APIs
  // and sent once, when the page is first hidden. Metrics a browser can't measure stay null.
  var vitals = { lcp: null, inp: null, cls: null, fcp: null, ttfb: null };
  var vitalsSent = false;
  var vitalsUrl = window.location.href; // the full page load the numbers belong to
  var interactions = {}; // interactionId -> longest event duration

  // Returns whether the browser supports the entry type.
  function observe(type, callback, options) {
    try {
      var types = PerformanceObserver.supportedEntryTypes || [];
      if (types.indexOf(type) === -1) return false;
      new PerformanceObserver(function (list) {
        list.getEntries().forEach(callback);
      }).observe(Object.assign({ type: type, buffered: true }, options));
      return true;
    } catch {
      return false;
    }
  }

  function trackVitals() {
    var nav = performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null;
    var activation = (nav && nav.activationStart) || 0; // prerendered pages count from activation
    if (nav && nav.responseStart > 0) vitals.ttfb = Math.max(0, nav.responseStart - activation);
    observe("paint", function (entry) {
      if (entry.name === "first-contentful-paint") vitals.fcp = Math.max(0, entry.startTime - activation);
    });
    observe("largest-contentful-paint", function (entry) {
      vitals.lcp = Math.max(0, entry.startTime - activation);
    });
    // CLS: the largest burst of unexpected shifts (under 1 s apart, at most 5 s long).
    var burst = 0;
    var burstStart = 0;
    var burstLast = 0;
    if (
      observe("layout-shift", function (entry) {
        if (entry.hadRecentInput) return;
        if (burst && entry.startTime - burstLast < 1000 && entry.startTime - burstStart < 5000) {
          burst += entry.value;
        } else {
          burst = entry.value;
          burstStart = entry.startTime;
        }
        burstLast = entry.startTime;
        vitals.cls = Math.max(vitals.cls, burst);
      })
    ) {
      vitals.cls = vitals.cls || 0;
    }
    // INP: the slowest interaction, ignoring one in every 50 as an outlier.
    function onInteraction(entry) {
      if (!entry.interactionId) return;
      interactions[entry.interactionId] = Math.max(interactions[entry.interactionId] || 0, entry.duration);
      var durations = Object.keys(interactions)
        .map(function (id) {
          return interactions[id];
        })
        .sort(function (a, b) {
          return b - a;
        });
      vitals.inp = durations[Math.min(durations.length - 1, Math.floor(durations.length / 50))];
    }
    observe("event", onInteraction, { durationThreshold: 40 });
    observe("first-input", onInteraction);
  }

  function sendVitals() {
    if (vitalsSent) return;
    var measured = Object.keys(vitals).some(function (name) {
      return vitals[name] !== null;
    });
    if (!measured) return;
    vitalsSent = true;
    postKeepalive(Object.assign({}, context, vitals, { event: "web_vitals", url: vitalsUrl, sessionId: sessionId }));
  }

  if (domain && attribute("data-web-vitals") !== "false" && typeof PerformanceObserver === "function") {
    trackVitals();
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") sendVitals();
    });
    window.addEventListener("pagehide", sendVitals);
  }

  // JavaScript errors: uncaught errors and unhandled promise rejections, each
  // distinct one once and at most MAX_ERRORS per page load. Errors from
  // cross-origin scripts, which the browser reduces to "Script error.", are skipped.
  var MAX_ERRORS = 10;
  var errorsSent = 0;
  var errorsSeen = {};

  function isErrorLike(value) {
    return value !== null && typeof value === "object" && typeof value.message === "string";
  }
  function describe(value) {
    if (typeof value === "string") return value;
    try {
      return JSON.stringify(value) || String(value);
    } catch {
      return String(value);
    }
  }
  function reportError(name, message, stack, file, line, col) {
    var key = name + "\n" + message + "\n" + (stack || "");
    if (errorsSent >= MAX_ERRORS || errorsSeen[key]) return;
    errorsSeen[key] = true;
    errorsSent++;
    postKeepalive(
      Object.assign(
        {
          event: "js_error",
          url: window.location.href,
          sessionId: sessionId,
          name: String(name).slice(0, 100),
          message: String(message).slice(0, 1000),
          stack: stack ? String(stack).slice(0, 8000) : null,
          file: file || null,
          line: line || null,
          col: col || null,
        },
        context
      )
    );
  }
  function onError(event) {
    var error = event.error;
    if (isErrorLike(error)) {
      return reportError(error.name || "Error", error.message, error.stack, event.filename, event.lineno, event.colno);
    }
    if (!event.filename && /^Script error\.?$/.test(event.message || "")) return;
    var message = error !== undefined && error !== null ? describe(error) : event.message || "";
    reportError("Error", message, null, event.filename, event.lineno, event.colno);
  }
  function onRejection(event) {
    var reason = event.reason;
    if (isErrorLike(reason)) return reportError(reason.name || "Error", reason.message, reason.stack);
    reportError("UnhandledRejection", describe(reason), null);
  }

  if (domain && attribute("data-errors") !== "false") {
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
  }

  // Replay calls queued before the script loaded (under a live session), then take over the global.
  ensureSession();
  var queued = (window.your_tracking && window.your_tracking.q) || [];
  window.your_tracking = send;
  queued.forEach(function (args) {
    send.apply(null, args);
  });

  var lastUrl = window.location.href;
  function pageview() {
    flush(); // the previous page's time, under its own URL and session
    current = null;
    engagedMs = 0;
    runningSince = null;
    ensureSession();
    lastUrl = window.location.href;
    current = { url: lastUrl, sessionId: sessionId };
    send("pageview");
    resume();
  }
  function onNavigate() {
    if (window.location.href !== lastUrl) pageview();
  }

  // Single-page apps change the URL with the History API, which fires no event.
  ["pushState", "replaceState"].forEach(function (method) {
    var original = history[method];
    history[method] = function () {
      var result = original.apply(this, arguments);
      onNavigate();
      return result;
    };
  });
  window.addEventListener("popstate", onNavigate);
  window.addEventListener("hashchange", onNavigate);

  pageview();
})();
