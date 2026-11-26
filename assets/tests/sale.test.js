const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const src = fs.readFileSync(path.join(__dirname, "..", "sale.js"), "utf8");

function textNode(v) { return { nodeType: 3, nodeValue: v }; }

function makePrice(text) {
  const kids = [textNode(text), { nodeType: 1, tag: "small" }];
  return {
    kids: kids,
    get firstChild() { return kids[0]; },
    insertBefore: function (el, ref) { kids.splice(kids.indexOf(ref), 0, el); }
  };
}

function run(iso, search) {
  const bodyKids = [{ tag: "nav" }];
  const prices = [makePrice("$29.99"), makePrice("Free")];
  const body = {
    get firstChild() { return bodyKids[0]; },
    insertBefore: function (el, ref) { bodyKids.splice(bodyKids.indexOf(ref), 0, el); }
  };
  const ctx = {
    Date: { UTC: Date.UTC, now: function () { return Date.parse(iso); } },
    window: { location: { search: search || "" } },
    document: {
      body: body,
      createElement: function (tag) { return { tag: tag, nodeType: 1 }; },
      querySelectorAll: function (sel) { return sel === ".price" ? prices : []; }
    }
  };
  vm.runInNewContext(src, ctx);
  return { bodyKids: bodyKids, prices: prices };
}

function onSale(r) { return r.bodyKids[0].className === "sale-bar"; }

// Before Thanksgiving in Pacific time nothing changes.
let r = run("2026-11-26T07:59:59Z");
assert.ok(!onSale(r));
assert.strictEqual(r.prices[0].kids[0].nodeValue, "$29.99");

// Thanksgiving midnight Pacific shows the banner and the sale price.
r = run("2026-11-26T08:00:00Z");
assert.ok(onSale(r));
assert.ok(/\$14\.99/.test(r.bodyKids[0].textContent));
assert.strictEqual(r.prices[0].kids[0].className, "price-was");
assert.strictEqual(r.prices[0].kids[0].textContent, "$29.99");
assert.strictEqual(r.prices[0].kids[1].nodeValue, "$14.99");
assert.strictEqual(r.prices[1].kids[0].nodeValue, "Free");

// The last minute of December 1 Pacific is still on sale.
assert.ok(onSale(run("2026-12-02T07:59:59Z")));

// December 2 Pacific is back to the regular price.
r = run("2026-12-02T08:00:00Z");
assert.ok(!onSale(r));
assert.strictEqual(r.prices[0].kids[0].nodeValue, "$29.99");

// The preview parameter shows the sale outside the window.
assert.ok(onSale(run("2026-11-25T12:00:00Z", "?sale-preview")));
assert.ok(onSale(run("2026-11-25T12:00:00Z", "?utm_source=reddit&sale-preview=1")));
assert.ok(!onSale(run("2026-11-25T12:00:00Z", "?not-sale-preview")));

console.log("sale.test.js: all assertions passed");
