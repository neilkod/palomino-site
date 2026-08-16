const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const src = fs.readFileSync(path.join(__dirname, "..", "campaign.js"), "utf8");
const STORE_URL = "https://apps.apple.com/us/app/palomino/id6779869483?mt=12";

function run(search, pathname) {
  const links = [{ href: STORE_URL }, { href: STORE_URL }];
  vm.runInNewContext(src, {
    window: { location: { search: search, pathname: pathname } },
    document: {
      querySelectorAll: function (sel) {
        return sel === ".js-appstore-link" ? links : [];
      }
    },
    URL: URL,
    URLSearchParams: URLSearchParams
  });
  return links.map(function (l) { return l.href; });
}

function assertTagged(hrefs, ct) {
  hrefs.forEach(function (href) {
    const params = new URL(href).searchParams;
    assert.strictEqual(params.get("pt"), "243206", href);
    assert.strictEqual(params.get("ct"), ct, href);
    assert.strictEqual(params.get("mt"), "12", href);
  });
}

function assertUntouched(hrefs) {
  hrefs.forEach(function (href) { assert.strictEqual(href, STORE_URL); });
}

assertUntouched(run("", "/"));
assertUntouched(run("?utm_source=facebook&utm_campaign=hasselblad", "/"));
assertUntouched(run("?utm_source=reddit", "/"));
assertUntouched(run("?utm_source=reddit&utm_campaign=unknown", "/"));
assertUntouched(run("?utm_source=reddit&utm_campaign=unknown", "/hasselblad/"));
assertUntouched(run("?utm_source=reddit&utm_campaign=__proto__", "/"));
assertUntouched(run("?utm_source=reddit", "/hasselblad-promo/"));
assertUntouched(run("?utm_source=reddit&utm_campaign=constructor", "/hasselblad/"));

assertTagged(run("?utm_source=reddit", "/hasselblad/"), "reddit-hasselblad");
assertTagged(run("?utm_source=REDDIT&utm_campaign=Hasselblad", "/"), "reddit-hasselblad");
assertTagged(run("?utm_source=reddit&utm_campaign=lightroom-wedding", "/"), "reddit-lightroom-wedding");
assertTagged(run("?utm_source=reddit&utm_campaign=Lightroom-Wildlife", "/"), "reddit-lightroom-wildlife");

console.log("campaign.test.js: all assertions passed");
