const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const shipped = fs.readFileSync(path.join(__dirname, "..", "meta-pixel.js"), "utf8");
assert.ok(/var PIXEL_ID = "[^"]*";/.test(shipped), "PIXEL_ID assignment must stay on one line");
assert.ok(shipped.indexOf('var PIXEL_ID = "1594358832218153";') !== -1, "shipped Pixel ID changed");
const withoutId = shipped.replace(/var PIXEL_ID = "[^"]*";/, 'var PIXEL_ID = "";');
const withId = shipped.replace(/var PIXEL_ID = "[^"]*";/, 'var PIXEL_ID = "123_test";');

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
  return ctx.fbq && ctx.fbq.queue ? JSON.parse(JSON.stringify(ctx.fbq.queue.map(function (args) { return Array.from(args); }))) : [];
}

function clickCount(ctx) {
  return calls(ctx).filter(function (c) { return c[0] === "trackCustom" && c[1] === "AppStoreClick"; }).length;
}

// The home page's inline pixel, standing in for Meta's real fbq.
function inlinePixel() {
  const queue = [];
  const fbq = function () { queue.push(arguments); };
  fbq.queue = queue;
  return { fbq: fbq };
}

// With no Pixel ID the script does nothing.
let r = load(withoutId, "?utm_source=meta");
assert.strictEqual(r.ctx.fbq, undefined);
assert.strictEqual(r.injected.length, 0);

// Organic visitors on pages without the inline pixel never load it.
r = load(withId, "");
assert.strictEqual(r.ctx.fbq, undefined);
r = load(withId, "?utm_source=newsletter");
assert.strictEqual(r.ctx.fbq, undefined);
r = load(withId, "?fbclid=abc");
assert.strictEqual(r.ctx.fbq, undefined);
r = load(withId, "?utm_source=reddit");
assert.strictEqual(r.ctx.fbq, undefined);

// A Meta ad visit loads the pixel once and records one PageView, with no click event on load.
r = load(withId, "?utm_source=Meta&utm_campaign=bfcm");
assert.deepStrictEqual(Array.from(r.injected), ["https://connect.facebook.net/en_US/fbevents.js"]);
assert.deepStrictEqual(calls(r.ctx), [["init", "123_test"], ["track", "PageView"]]);
assert.strictEqual(clickCount(r.ctx), 0);

// Clicking any App Store link sends one AppStoreClick per page view, however many times it is clicked.
r = load(withId, "?utm_source=meta");
r.links[0].fire("click");
r.links[0].fire("click");
r.links[1].fire("click");
assert.strictEqual(clickCount(r.ctx), 1);

// A middle-click counts; a right-button auxclick does not.
r = load(withId, "?utm_source=meta");
r.links[0].fire("auxclick", { button: 2 });
assert.strictEqual(clickCount(r.ctx), 0);
r.links[0].fire("auxclick", { button: 1 });
assert.strictEqual(clickCount(r.ctx), 1);

// On the home page the inline pixel is already loaded: no second load or init, and clicks are tracked for every visitor.
r = load(withId, "", undefined, inlinePixel());
assert.strictEqual(r.injected.length, 0);
assert.deepStrictEqual(calls(r.ctx), []);
r.links[0].fire("click");
assert.strictEqual(clickCount(r.ctx), 1);

// Loading the script twice on one page does not inject or initialize a second pixel.
r = load(withId, "?utm_source=meta");
const again = load(withId, "?utm_source=meta", undefined, r.ctx);
assert.strictEqual(again.injected.length, 0);
assert.strictEqual(calls(r.ctx).filter(function (c) { return c[0] === "init"; }).length, 1);

// The ad visit carries over to later pages in the same tab, and ends when another source arrives.
const session = memoryStorage();
load(withId, "?utm_source=meta", session);
assert.strictEqual(load(withId, "", session).injected.length, 1);
assert.strictEqual(load(withId, "?utm_source=reddit", session).injected.length, 0);
assert.strictEqual(load(withId, "", session).injected.length, 0);

// Blocked storage falls back to the URL alone instead of throwing.
const blocked = { getItem: function () { throw new Error("blocked"); }, setItem: function () { throw new Error("blocked"); } };
assert.strictEqual(load(withId, "?utm_source=meta", blocked).injected.length, 1);
assert.strictEqual(load(withId, "", blocked).injected.length, 0);

// A blocked pixel request leaves the links working: tracking never throws from the click handler.
r = load(withId, "?utm_source=meta");
r.ctx.fbq = function () { throw new Error("blocked"); };
assert.doesNotThrow(function () { r.links[0].fire("click"); });

console.log("meta-pixel.test.js: all assertions passed");
