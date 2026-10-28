(function () {
  var PIXEL_ID = "p2_1a6clx80eutzf";
  if (!PIXEL_ID) return;
  try {
    // Only Reddit ad visitors and Reddit's own setup tool load the pixel, so organic visitors get no ad tracking.
    var storageKey = "palomino-reddit";
    var params = new URLSearchParams(window.location.search);
    var source = (params.get("utm_source") || "").toLowerCase();
    var fromAd = source === "reddit" || params.has("rdt_cid");
    try {
      if (fromAd) window.sessionStorage.setItem(storageKey, "1");
      else if (source) window.sessionStorage.removeItem(storageKey);
      else fromAd = window.sessionStorage.getItem(storageKey) === "1";
    } catch (e) {}
    // Reddit's event setup tool opens the site in a popup and waits for pixel.js to message its opener.
    var setupTool = params.has("reddit_open_est") || !!window.opener || /^https:\/\/ads\.reddit\.com(\/|$)/.test(document.referrer || "");
    if (!(fromAd || setupTool) || window.rdt) return;

    !function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js?pixel_id="+PIXEL_ID;t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);rdt('init',PIXEL_ID);rdt('track', 'PageVisit');

    var sent = false;
    var track = function () {
      if (sent) return;
      sent = true;
      try { window.rdt("track", "Custom", { customEventName: "App Store Click" }); } catch (e) {}
    };
    document.querySelectorAll(".js-appstore-link").forEach(function (link) {
      link.addEventListener("click", track);
      link.addEventListener("auxclick", function (e) { if (e.button === 1) track(); });
    });
  } catch (e) {}
})();
