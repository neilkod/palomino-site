(function () {
  try {
    var params = new URLSearchParams(window.location.search);
    if ((params.get("utm_source") || "").toLowerCase() !== "reddit") return;
    var campaigns = {
      "hasselblad": "reddit-hasselblad",
      "lightroom-wedding": "reddit-lightroom-wedding",
      "lightroom-wildlife": "reddit-lightroom-wildlife"
    };
    var campaignParam = params.get("utm_campaign");
    var ct;
    if (campaignParam) {
      var key = campaignParam.toLowerCase();
      if (Object.prototype.hasOwnProperty.call(campaigns, key)) ct = campaigns[key];
    } else if (/^\/hasselblad(\/|$)/.test(window.location.pathname)) {
      ct = "reddit-hasselblad";
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
