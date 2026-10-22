/*
 * Analytica tracking script. Add to a page with:
 *   <script defer data-domain="example.com" src="https://analytica-phi.vercel.app/tracking-script.js"></script>
 *
 * Sends a `session_start` when a visitor's session begins (sessions last 10 minutes),
 * a `pageview` for the first page and every client-side navigation, and a
 * `session_end` when an expired session is replaced. Custom calls:
 *   window.your_tracking("event_name", { callback: fn })
 * Calls made before this script loads can be queued in window.your_tracking.q.
 */
(function () {
  "use strict";

  var ENDPOINT = "https://analytica-phi.vercel.app/api/track";
  var SESSION_MS = 10 * 60 * 1000;
  var KEY_ID = "session_id";
  var KEY_EXPIRES = "session_expiration_timestamp";

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

  function send(event, options) {
    try {
      var payload = Object.assign({ event: event, url: window.location.href }, context);
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

  function randomId() {
    var bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return "session-" + Array.from(bytes, function (b) {
      return b.toString(16).padStart(2, "0");
    }).join("");
  }

  function startSession() {
    localStorage.setItem(KEY_ID, randomId());
    localStorage.setItem(KEY_EXPIRES, String(Date.now() + SESSION_MS));
    send("session_start");
  }

  function ensureSession() {
    var expires = Number(localStorage.getItem(KEY_EXPIRES));
    if (!localStorage.getItem(KEY_ID) || !expires) {
      startSession();
    } else if (Date.now() >= expires) {
      send("session_end");
      startSession();
    }
  }

  // Replay calls queued before the script loaded, then take over the global.
  var queued = (window.your_tracking && window.your_tracking.q) || [];
  window.your_tracking = send;
  queued.forEach(function (args) {
    send.apply(null, args);
  });

  ensureSession();

  var lastUrl = window.location.href;
  function pageview() {
    lastUrl = window.location.href;
    send("pageview");
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
