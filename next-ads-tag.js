(function () {
  "use strict";

  var WEBSITE_ID = "42";
  var API_BASE = "https://api-dev.next-ads-server-dev.com";
  var ZONE_CONFIGS = [
    { id: 56, cssSelector: ".next-ads-zone-1", width: 300, height: 250 },
    { id: 57, cssSelector: ".next-ads-zone-2", width: 300, height: 250 },
    { id: 58, cssSelector: ".next-ads-zone-3", width: 300, height: 250 },
    { id: 59, cssSelector: ".next-ads-zone-4", width: 728, height: 90 },
  ];

  // Generate unique request ID for tracking
  function generateRid() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // Fire tracking beacon (non-blocking)
  function track(type, bannerId, zoneId, rid) {
    if (!bannerId) return;
    var data = JSON.stringify({
      type: type,
      bid: bannerId,
      zid: zoneId,
      rid: rid,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        API_BASE + "/track/event",
        new Blob([data], { type: "application/json" })
      );
    } else {
      var img = new Image();
      img.src =
        API_BASE +
        "/track/pixel.gif?type=" +
        type +
        "&bid=" +
        bannerId +
        "&zid=" +
        zoneId +
        "&rid=" +
        rid;
    }
  }

  // Discover zones using custom selectors and manual placement
  function discoverZones() {
    var discovered = {};

    // Phase 1: Dynamic discovery using custom CSS selectors from zone configs
    for (var i = 0; i < ZONE_CONFIGS.length; i++) {
      var config = ZONE_CONFIGS[i];
      if (config.cssSelector) {
        var el = document.querySelector(config.cssSelector);
        if (el) {
          // Mark element with zone ID for consistent rendering
          console.log("Found zone", el);
          el.setAttribute("data-zone-id", String(config.id));
          el.classList.add("next-ads-zone");
          discovered[config.id] = el;
        }
      }
    }

    // Phase 2: Manual fallback - find zones placed manually by publisher
    var manualZones = document.querySelectorAll(".next-ads-zone[data-zone-id]");
    for (var j = 0; j < manualZones.length; j++) {
      var zoneEl = manualZones[j];
      var zoneId = parseInt(zoneEl.getAttribute("data-zone-id"), 10);
      if (zoneId && !discovered[zoneId]) {
        discovered[zoneId] = zoneEl;
      }
    }

    return discovered;
  }

  function init() {
    var discoveredZones = discoverZones();
    var zoneIds = Object.keys(discoveredZones).map(function (id) {
      return parseInt(id, 10);
    });

    if (zoneIds.length === 0) return;

    fetch(API_BASE + "/creative/get-banners?zoneIds=" + zoneIds.join(","), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then(function (res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function (data) {
        if (data && data.zones) renderBanners(data.zones, discoveredZones);
      })
      .catch(function () {
        // Silent fail - do not disrupt publisher's site
      });
  }

  function renderBanners(zones, discoveredZones) {
    for (var i = 0; i < zones.length; i++) {
      var zone = zones[i];
      var el = discoveredZones[zone.zoneId];
      if (el && zone.content && zone.mime) {
        var rid = generateRid();

        // For images
        if (zone.mime.startsWith("image/")) {
          el.innerHTML = ""; // Clear the container

          var img = new Image();
          img.src = "data:" + zone.mime + ";base64," + zone.content;
          img.style.width = "100%";
          img.style.height = "100%";
          img.style.objectFit = "cover";

          el.appendChild(img);
        }
        // For HTML
        else if (zone.mime === "text/html") {
          el.innerHTML = zone.content;
        }

        el.setAttribute("data-bid", zone.bannerId || "");
        el.setAttribute("data-rid", rid);

        // Fire impression
        track("impression", zone.bannerId, zone.zoneId, rid);

        // Track clicks (prevent duplicate listeners on re-init)
        if (!el.hasAttribute("data-tracking-bound")) {
          el.setAttribute("data-tracking-bound", "1");
          (function (bannerId, zoneId, requestId) {
            el.addEventListener("click", function () {
              track("click", bannerId, zoneId, requestId);
            });
          })(zone.bannerId, zone.zoneId, rid);
        }
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
