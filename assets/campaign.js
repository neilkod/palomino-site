(function () {
  try {
    var redditCampaigns = {
      "hasselblad": "reddit-hasselblad",
      "lightroom-wedding": "reddit-lightroom-wedding",
      "lightroom-wildlife": "reddit-lightroom-wildlife",
      "sunday": "reddit-sunday",
      "burst": "reddit-burst",
      "lightroom-import": "reddit-lr-import",
      "sports": "reddit-sports",
      "wildlife": "reddit-wildlife",
      "wedding-kiss": "reddit-wedding-kiss",
      "wedding-blink": "reddit-wedding-blink",
      "wedding-sneakpeek": "reddit-wedding-sneakpeek",
      "bfcm": "reddit-bfcm"
    };
    var metaCampaigns = {
      "bfcm": "meta-bfcm",
      "general": "meta-general",
      "wedding": "meta-wedding",
      "sports": "meta-sports",
      "wildlife": "meta-wildlife"
    };
    var sources = {
      "reddit": { campaigns: redditCampaigns, fallback: "reddit-other" },
      "meta": { campaigns: metaCampaigns, fallback: "meta-other" }
    };
    var storageKey = "palomino-ct";
    var known = function (ct) {
      for (var s in sources) {
        if (!Object.prototype.hasOwnProperty.call(sources, s)) continue;
        var src = sources[s];
        if (ct === src.fallback) return true;
        for (var k in src.campaigns) {
          if (Object.prototype.hasOwnProperty.call(src.campaigns, k) && src.campaigns[k] === ct) return true;
        }
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
    if (Object.prototype.hasOwnProperty.call(sources, source)) {
      var campaigns = sources[source].campaigns;
      var campaignParam = params.get("utm_campaign");
      if (campaignParam) {
        var key = campaignParam.toLowerCase();
        if (Object.prototype.hasOwnProperty.call(campaigns, key)) ct = campaigns[key];
      } else if (source === "reddit" && /^\/hasselblad(\/|$)/.test(window.location.pathname)) {
        ct = "reddit-hasselblad";
      }
      ct = ct || sources[source].fallback;
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
