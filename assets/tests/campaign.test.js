const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const src = fs.readFileSync(path.join(__dirname, "..", "campaign.js"), "utf8");
const STORE_URL = "https://apps.apple.com/us/app/palomino/id6779869483?mt=12";

function memoryStorage(initial) {
  const data = Object.assign({}, initial);
  return {
    data: data,
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
    setItem: function (k, v) { data[k] = String(v); },
    removeItem: function (k) { delete data[k]; }
  };
}

function run(search, pathname, storage) {
  const links = [{ href: STORE_URL }, { href: STORE_URL }];
  vm.runInNewContext(src, {
    window: { location: { search: search, pathname: pathname }, sessionStorage: storage || memoryStorage() },
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
assertUntouched(run("?campaign=https://evil.example", "/"));
assertUntouched(run("?ct=attacker&pt=1", "/"));

assertTagged(run("?utm_source=reddit", "/"), "reddit-other");
assertTagged(run("?utm_source=reddit&utm_campaign=unknown", "/"), "reddit-other");
assertTagged(run("?utm_source=reddit&utm_campaign=unknown", "/hasselblad/"), "reddit-other");
assertTagged(run("?utm_source=reddit&utm_campaign=__proto__", "/"), "reddit-other");
assertTagged(run("?utm_source=reddit", "/hasselblad-promo/"), "reddit-other");
assertTagged(run("?utm_source=reddit&utm_campaign=constructor", "/hasselblad/"), "reddit-other");

assertTagged(run("?utm_source=reddit", "/hasselblad/"), "reddit-hasselblad");
assertTagged(run("?utm_source=REDDIT&utm_campaign=Hasselblad", "/"), "reddit-hasselblad");
assertTagged(run("?utm_source=reddit&utm_campaign=lightroom-wedding", "/"), "reddit-lightroom-wedding");
assertTagged(run("?utm_source=reddit&utm_campaign=Lightroom-Wildlife", "/"), "reddit-lightroom-wildlife");

assertTagged(run("?utm_source=reddit&utm_campaign=sunday", "/weddings/"), "reddit-sunday");
assertTagged(run("?utm_source=reddit&utm_campaign=burst&rdt_cid=123", "/"), "reddit-burst");
assertTagged(run("?utm_source=reddit&utm_campaign=lightroom-import", "/"), "reddit-lr-import");

const session = memoryStorage();
assertTagged(run("?utm_source=reddit&utm_campaign=sunday", "/weddings/", session), "reddit-sunday");
assertTagged(run("", "/manual/", session), "reddit-sunday");
assertTagged(run("?ref=nav", "/fuji/", session), "reddit-sunday");
assertUntouched(run("?utm_source=newsletter", "/", session));
assertUntouched(run("", "/", session));

assertUntouched(run("", "/", memoryStorage({ "palomino-ct": "attacker-token" })));
assertUntouched(run("", "/", { getItem: function () { throw new Error("blocked"); } }));
assertTagged(run("?utm_source=reddit&utm_campaign=burst", "/", { getItem: function () { throw new Error("blocked"); }, setItem: function () { throw new Error("blocked"); } }), "reddit-burst");

console.log("campaign.test.js: all assertions passed");
