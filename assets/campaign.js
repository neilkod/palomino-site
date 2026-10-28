(function () {
  try {
    var campaigns = {
      "hasselblad": "reddit-hasselblad",
      "lightroom-wedding": "reddit-lightroom-wedding",
      "lightroom-wildlife": "reddit-lightroom-wildlife",
      "sunday": "reddit-sunday",
      "burst": "reddit-burst",
      "lightroom-import": "reddit-lr-import"
    };
    var fallback = "reddit-other";
    var storageKey = "palomino-ct";
    var known = function (ct) {
      if (ct === fallback) return true;
      for (var k in campaigns) {
        if (Object.prototype.hasOwnProperty.call(campaigns, k) && campaigns[k] === ct) return true;
      }
      return false;
    };
    var store = function (action, value) {
      try {
        if (action === "get") return window.sessionStorage.getItem(storageKey);
        if (action === "set") window.sessionStorage.setItem(storageKey, value);
        if (action === "clear") window.sessionStorage.removeItem(storageKey);
      } catch (e) {}
      return null;
    };

    var params = new URLSearchParams(window.location.search);
    var source = (params.get("utm_source") || "").toLowerCase();
    var ct;
    if (source === "reddit") {
      var campaignParam = params.get("utm_campaign");
      if (campaignParam) {
        var key = campaignParam.toLowerCase();
        if (Object.prototype.hasOwnProperty.call(campaigns, key)) ct = campaigns[key];
      } else if (/^\/hasselblad(\/|$)/.test(window.location.pathname)) {
        ct = "reddit-hasselblad";
      }
      ct = ct || fallback;
      store("set", ct);
    } else if (source) {
      store("clear");
    } else {
      var saved = store("get");
      if (saved && known(saved)) ct = saved;
    }
    if (!ct) return;
    document.querySelectorAll(".js-appstore-link").forEach(function (link) {
      var url = new URL(link.href);
      url.searchParams.set("pt", "243206");
      url.searchParams.set("ct", ct);
      link.href = url.toString();
    });
  } catch (e) {}
})();
