(function () {
  try {
    var START = Date.UTC(2026, 10, 26, 8);
    var END = Date.UTC(2026, 11, 2, 8);
    var now = Date.now();
    var preview = /[?&]sale-preview(=|&|$)/.test(window.location.search);
    if (!preview && (now < START || now >= END)) return;

    var style = document.createElement("style");
    style.textContent =
      ".sale-bar{background:var(--ink-button,#1d1b18);color:var(--on-ink-button,#f4f0e8);font-family:var(--sans,-apple-system,sans-serif);font-size:0.9rem;line-height:1.45;padding:11px 16px;text-align:center}" +
      ".sale-bar .sale-inner{max-width:var(--page,1200px);margin:0 auto;display:flex;flex-wrap:wrap;justify-content:center;align-items:baseline;gap:4px 16px}" +
      ".sale-bar .sale-tag{font-size:0.7rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;opacity:0.7}" +
      ".sale-bar .sale-price{font-family:var(--serif,Georgia,serif);font-size:1.12rem}" +
      ".sale-bar s{opacity:0.6}" +
      ".sale-bar a{color:inherit;font-weight:600;text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1px;white-space:nowrap}" +
      ".plan .price .price-was{font-size:0.55em;color:var(--muted,#6a6358);margin-right:0.35em;text-decoration-thickness:1px}" +
      ".plan .price .price-was~small{display:block;margin:8px 0 0}";
    document.head.appendChild(style);

    var store = document.querySelector(".js-appstore-link");
    var link = store ? '<a class="js-appstore-link" href="' + store.getAttribute("href") + '">Get it on the Mac App Store</a>' : "";
    var bar = document.createElement("div");
    bar.className = "sale-bar";
    bar.innerHTML =
      '<div class="sale-inner">' +
      '<span class="sale-tag">Black Friday</span>' +
      '<span>Palomino Pro is half price, <span class="sale-price">$14.99</span> instead of <s>$29.99</s>, through December 1.</span>' +
      link +
      "</div>";
    document.body.insertBefore(bar, document.body.firstChild);

    document.querySelectorAll(".price").forEach(function (el) {
      var first = el.firstChild;
      if (!first || first.nodeType !== 3 || first.nodeValue.trim() !== "$29.99") return;
      var was = document.createElement("s");
      was.className = "price-was";
      was.textContent = "$29.99";
      first.nodeValue = "$14.99";
      el.insertBefore(was, first);
    });

    document.querySelectorAll(".js-pro-price").forEach(function (el) {
      if (el.textContent.trim() === "$29.99") el.textContent = "$14.99";
    });
  } catch (e) {}
})();
