(function () {
  var root = document.querySelector(".story");
  if (!root) return;
  var stage = root.querySelector(".story-stage");
  var scenes = Array.prototype.slice.call(stage.querySelectorAll(".story-scene"));
  var dotsEl = root.querySelector(".story-dots");
  var toggle = root.querySelector(".story-toggle");
  var count = root.querySelector(".story-count");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cur = 0, timer = null, started = 0, remaining = 0, playing = false, userPaused = reduce;

  var dots = scenes.map(function (s, i) {
    s.setAttribute("aria-label", "Scene " + (i + 1) + " of " + scenes.length);
    var b = document.createElement("button");
    b.className = "story-dot";
    b.type = "button";
    b.setAttribute("aria-label", "Show scene " + (i + 1) + " of " + scenes.length);
    b.addEventListener("click", function () { show(i); });
    dotsEl.appendChild(b);
    return b;
  });

  function dur(i) { return parseFloat(scenes[i].getAttribute("data-dur")) * 1000; }

  function show(i) {
    cur = (i + scenes.length) % scenes.length;
    scenes.forEach(function (s, k) {
      s.classList.toggle("on", k === cur);
      s.setAttribute("aria-hidden", k === cur ? "false" : "true");
    });
    dots.forEach(function (t, k) { t.setAttribute("aria-current", k === cur ? "true" : "false"); });
    var d = dur(cur);
    stage.style.setProperty("--story-dur", d + "ms");
    count.textContent = (cur + 1) + " / " + scenes.length;
    remaining = d;
    if (playing) schedule();
  }

  function schedule() {
    clearTimeout(timer);
    started = performance.now();
    timer = setTimeout(function () { show(cur + 1); }, remaining);
  }

  function play() {
    if (playing) return;
    playing = true;
    root.classList.remove("paused");
    toggle.textContent = "Pause";
    toggle.setAttribute("aria-label", "Pause the presentation");
    schedule();
  }

  function pause() {
    if (!playing) return;
    playing = false;
    clearTimeout(timer);
    remaining -= performance.now() - started;
    root.classList.add("paused");
    toggle.textContent = "Play";
    toggle.setAttribute("aria-label", "Resume the presentation");
  }

  toggle.addEventListener("click", function () {
    userPaused = playing;
    if (playing) pause(); else play();
  });

  stage.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") show(cur + 1);
    if (e.key === "ArrowLeft") show(cur - 1);
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) pause();
      else if (!userPaused) play();
    }, { threshold: 0.35 }).observe(stage);
  }

  show(0);
  if (reduce) {
    root.classList.add("paused");
    toggle.textContent = "Play";
    toggle.setAttribute("aria-label", "Start the presentation");
  } else if (!("IntersectionObserver" in window)) {
    play();
  }
})();
