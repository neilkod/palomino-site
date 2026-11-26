(function () {
  var PIXEL_ID = "1594358832218153";
  if (!PIXEL_ID) return;
  try {
    // The home page loads the Meta Pixel inline for every visitor. Elsewhere only Meta ad visitors load it, for the rest of the tab.
    var storageKey = "palomino-meta";
    var params = new URLSearchParams(window.location.search);
    var source = (params.get("utm_source") || "").toLowerCase();
    var fromAd = source === "meta";
    try {
      if (fromAd) window.sessionStorage.setItem(storageKey, "1");
      else if (source) window.sessionStorage.removeItem(storageKey);
      else fromAd = window.sessionStorage.getItem(storageKey) === "1";
    } catch (e) {}
    if (!fromAd && !window.fbq) return;

    if (!window.fbq) {
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      window.fbq("init", PIXEL_ID);
      window.fbq("track", "PageView");
    }

    var sent = false;
    var track = function () {
      if (sent) return;
      sent = true;
      try { window.fbq("trackCustom", "AppStoreClick"); } catch (e) {}
    };
    document.querySelectorAll(".js-appstore-link").forEach(function (link) {
      link.addEventListener("click", track);
      link.addEventListener("auxclick", function (e) { if (e.button === 1) track(); });
    });
  } catch (e) {}
})();
