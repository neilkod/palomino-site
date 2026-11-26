(function () {
  try {
    var START = Date.UTC(2026, 10, 26, 8);
    var END = Date.UTC(2026, 11, 2, 8);
    var now = Date.now();
    var preview = /[?&]sale-preview(=|&|$)/.test(window.location.search);
    if (!preview && (now < START || now >= END)) return;

    var bar = document.createElement("div");
    bar.className = "sale-bar";
    bar.textContent = "Palomino Pro is half price for Black Friday: $14.99 instead of $29.99, through December 1.";
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
  } catch (e) {}
})();
