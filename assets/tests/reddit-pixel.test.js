const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const shipped = fs.readFileSync(path.join(__dirname, "..", "reddit-pixel.js"), "utf8");
assert.ok(/var PIXEL_ID = "[^"]*";/.test(shipped), "PIXEL_ID assignment must stay on one line");
assert.ok(shipped.indexOf('var PIXEL_ID = "p2_1a6clx80eutzf";') !== -1, "shipped Pixel ID changed");
const withoutId = shipped.replace(/var PIXEL_ID = "[^"]*";/, 'var PIXEL_ID = "";');
const withId = shipped.replace(/var PIXEL_ID = "[^"]*";/, 'var PIXEL_ID = "a2_test";');

function memoryStorage(initial) {
  const data = Object.assign({}, initial);
  return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
    setItem: function (k, v) { data[k] = String(v); },
    removeItem: function (k) { delete data[k]; }
  };
}

function makeLink() {
  const handlers = {};
  return {
    addEventListener: function (type, fn) { (handlers[type] = handlers[type] || []).push(fn); },
    fire: function (type, e) { (handlers[type] || []).forEach(function (fn) { fn(e || { button: 0 }); }); }
  };
}

function load(src, search, storage, ctx) {
  const injected = [];
  const links = [makeLink(), makeLink()];
  ctx = ctx || {};
  ctx.location = { search: search };
  ctx.sessionStorage = storage || memoryStorage();
  ctx.URLSearchParams = URLSearchParams;
  ctx.document = {
    referrer: ctx.referrer || "",
    createElement: function () { return {}; },
    getElementsByTagName: function () {
      return [{ parentNode: { insertBefore: function (el) { injected.push(el.src); } } }];
    },
    querySelectorAll: function (sel) { return sel === ".js-appstore-link" ? links : []; }
  };
  ctx.window = ctx;
  vm.runInNewContext(src, ctx);
  return { ctx: ctx, injected: injected, links: links };
}

function calls(ctx) {
  return ctx.rdt ? JSON.parse(JSON.stringify(ctx.rdt.callQueue.map(function (args) { return Array.from(args); }))) : [];
}

function customCount(ctx) {
  return calls(ctx).filter(function (c) {
    return c[0] === "track" && c[1] === "Custom" && c[2] && c[2].customEventName === "App Store Click";
  }).length;
}

// With no Pixel ID the script does nothing.
let r = load(withoutId, "?utm_source=reddit");
assert.strictEqual(r.ctx.rdt, undefined);
assert.strictEqual(r.injected.length, 0);

// Organic visitors never load the pixel.
r = load(withId, "");
assert.strictEqual(r.ctx.rdt, undefined);
r = load(withId, "?utm_source=newsletter");
assert.strictEqual(r.ctx.rdt, undefined);

// A Reddit ad visit loads the pixel once and records one PageVisit, with no click event on load.
r = load(withId, "?utm_source=Reddit&utm_campaign=sunday");
assert.deepStrictEqual(Array.from(r.injected), ["https://www.redditstatic.com/ads/pixel.js?pixel_id=a2_test"]);
assert.deepStrictEqual(calls(r.ctx), [["init", "a2_test"], ["track", "PageVisit"]]);
assert.strictEqual(customCount(r.ctx), 0);

// The click ID alone also identifies an ad visit.
r = load(withId, "?rdt_cid=abc");
assert.strictEqual(r.injected.length, 1);

// Clicking any App Store link sends one App Store Click per page view, however many times it is clicked.
r = load(withId, "?utm_source=reddit");
r.links[0].fire("click");
r.links[0].fire("click");
r.links[1].fire("click");
assert.strictEqual(customCount(r.ctx), 1);

// A middle-click counts; a right-button auxclick does not.
r = load(withId, "?utm_source=reddit");
r.links[0].fire("auxclick", { button: 2 });
assert.strictEqual(customCount(r.ctx), 0);
r.links[0].fire("auxclick", { button: 1 });
assert.strictEqual(customCount(r.ctx), 1);

// Loading the script twice on one page does not inject or initialize a second pixel.
r = load(withId, "?utm_source=reddit");
const again = load(withId, "?utm_source=reddit", undefined, r.ctx);
assert.strictEqual(again.injected.length, 0);
assert.strictEqual(calls(r.ctx).filter(function (c) { return c[0] === "init"; }).length, 1);

// The ad visit carries over to later pages in the same tab, and ends when another source arrives.
const session = memoryStorage();
load(withId, "?utm_source=reddit", session);
assert.strictEqual(load(withId, "", session).injected.length, 1);
assert.strictEqual(load(withId, "?utm_source=newsletter", session).injected.length, 0);
assert.strictEqual(load(withId, "", session).injected.length, 0);

// Reddit's event setup tool loads the pixel without starting an ad session.
const toolSession = memoryStorage();
assert.strictEqual(load(withId, "?reddit_open_est=true", toolSession).injected.length, 1);
assert.strictEqual(load(withId, "", toolSession).injected.length, 0);
assert.strictEqual(load(withId, "", undefined, { opener: {} }).injected.length, 1);
assert.strictEqual(load(withId, "", undefined, { referrer: "https://ads.reddit.com/events-manager" }).injected.length, 1);
assert.strictEqual(load(withId, "", undefined, { referrer: "https://www.reddit.com/r/WeddingPhotography/" }).injected.length, 0);
assert.strictEqual(load(withId, "", undefined, { referrer: "https://ads.reddit.com.example.net/" }).injected.length, 0);

// Blocked storage falls back to the URL alone instead of throwing.
const blocked = { getItem: function () { throw new Error("blocked"); }, setItem: function () { throw new Error("blocked"); } };
assert.strictEqual(load(withId, "?utm_source=reddit", blocked).injected.length, 1);
assert.strictEqual(load(withId, "", blocked).injected.length, 0);

// A blocked pixel request leaves the links working: tracking never throws from the click handler.
r = load(withId, "?utm_source=reddit");
r.ctx.rdt = function () { throw new Error("blocked"); };
assert.doesNotThrow(function () { r.links[0].fire("click"); });

console.log("reddit-pixel.test.js: all assertions passed");
