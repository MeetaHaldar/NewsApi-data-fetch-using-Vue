globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import 'node-fetch-native/polyfill';
import { Server as Server$1 } from 'http';
import { Server } from 'https';
import destr from 'destr';
import { defineEventHandler, handleCacheHeaders, createEvent, eventHandler, createError, createApp, createRouter, lazyEventHandler } from 'h3';
import { createFetch as createFetch$1, Headers } from 'ohmyfetch';
import { createRouter as createRouter$1 } from 'radix3';
import { createCall, createFetch } from 'unenv/runtime/fetch/index';
import { createHooks } from 'hookable';
import { snakeCase } from 'scule';
import { hash } from 'ohash';
import { createStorage } from 'unstorage';
import { withQuery, withLeadingSlash, withoutTrailingSlash, parseURL } from 'ufo';
import { promises } from 'fs';
import { resolve, dirname } from 'pathe';
import { fileURLToPath } from 'url';

const _runtimeConfig = {"app":{"baseURL":"/","buildAssetsDir":"/_nuxt/","cdnURL":""},"nitro":{"routes":{},"envPrefix":"NUXT_"},"public":{}};
const ENV_PREFIX = "NITRO_";
const ENV_PREFIX_ALT = _runtimeConfig.nitro.envPrefix ?? process.env.NITRO_ENV_PREFIX ?? "_";
const getEnv = (key) => {
  const envKey = snakeCase(key).toUpperCase();
  return destr(process.env[ENV_PREFIX + envKey] ?? process.env[ENV_PREFIX_ALT + envKey]);
};
function isObject(input) {
  return typeof input === "object" && !Array.isArray(input);
}
function overrideConfig(obj, parentKey = "") {
  for (const key in obj) {
    const subKey = parentKey ? `${parentKey}_${key}` : key;
    const envValue = getEnv(subKey);
    if (isObject(obj[key])) {
      if (isObject(envValue)) {
        obj[key] = { ...obj[key], ...envValue };
      }
      overrideConfig(obj[key], subKey);
    } else {
      obj[key] = envValue ?? obj[key];
    }
  }
}
overrideConfig(_runtimeConfig);
const config = deepFreeze(_runtimeConfig);
const useRuntimeConfig = () => config;
function deepFreeze(object) {
  const propNames = Object.getOwnPropertyNames(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      deepFreeze(value);
    }
  }
  return Object.freeze(object);
}

const globalTiming = globalThis.__timing__ || {
  start: () => 0,
  end: () => 0,
  metrics: []
};
function timingMiddleware(_req, res, next) {
  const start = globalTiming.start();
  const _end = res.end;
  res.end = (data, encoding, callback) => {
    const metrics = [["Generate", globalTiming.end(start)], ...globalTiming.metrics];
    const serverTiming = metrics.map((m) => `-;dur=${m[1]};desc="${encodeURIComponent(m[0])}"`).join(", ");
    if (!res.headersSent) {
      res.setHeader("Server-Timing", serverTiming);
    }
    _end.call(res, data, encoding, callback);
  };
  next();
}

const _assets = {

};

function normalizeKey(key) {
  if (!key) {
    return "";
  }
  return key.replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "");
}

const assets$1 = {
  getKeys() {
    return Promise.resolve(Object.keys(_assets))
  },
  hasItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(id in _assets)
  },
  getItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].import() : null)
  },
  getMeta (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].meta : {})
  }
};

const storage = createStorage({});

const useStorage = () => storage;

storage.mount('/assets', assets$1);

const defaultCacheOptions = {
  name: "_",
  base: "/cache",
  swr: true,
  maxAge: 1
};
function defineCachedFunction(fn, opts) {
  opts = { ...defaultCacheOptions, ...opts };
  const pending = {};
  const group = opts.group || "nitro";
  const name = opts.name || fn.name || "_";
  const integrity = hash([opts.integrity, fn, opts]);
  async function get(key, resolver) {
    const cacheKey = [opts.base, group, name, key].filter(Boolean).join(":").replace(/:\/$/, ":index");
    const entry = await useStorage().getItem(cacheKey) || {};
    const ttl = (opts.maxAge ?? opts.maxAge ?? 0) * 1e3;
    if (ttl) {
      entry.expires = Date.now() + ttl;
    }
    const expired = entry.integrity !== integrity || ttl && Date.now() - (entry.mtime || 0) > ttl;
    const _resolve = async () => {
      if (!pending[key]) {
        pending[key] = Promise.resolve(resolver());
      }
      entry.value = await pending[key];
      entry.mtime = Date.now();
      entry.integrity = integrity;
      delete pending[key];
      useStorage().setItem(cacheKey, entry).catch((error) => console.error("[nitro] [cache]", error));
    };
    const _resolvePromise = expired ? _resolve() : Promise.resolve();
    if (opts.swr && entry.value) {
      _resolvePromise.catch(console.error);
      return Promise.resolve(entry);
    }
    return _resolvePromise.then(() => entry);
  }
  return async (...args) => {
    const key = (opts.getKey || getKey)(...args);
    const entry = await get(key, () => fn(...args));
    let value = entry.value;
    if (opts.transform) {
      value = await opts.transform(entry, ...args) || value;
    }
    return value;
  };
}
const cachedFunction = defineCachedFunction;
function getKey(...args) {
  return args.length ? hash(args, {}) : "";
}
function defineCachedEventHandler(handler, opts) {
  const _opts = {
    ...opts,
    getKey: (event) => {
      return event.req.originalUrl || event.req.url;
    },
    group: opts.group || "nitro/handlers",
    integrity: [
      opts.integrity,
      handler
    ]
  };
  const _cachedHandler = cachedFunction(async (incomingEvent) => {
    const reqProxy = cloneWithProxy(incomingEvent.req, { headers: {} });
    const resHeaders = {};
    const resProxy = cloneWithProxy(incomingEvent.res, {
      statusCode: 200,
      getHeader(name) {
        return resHeaders[name];
      },
      setHeader(name, value) {
        resHeaders[name] = value;
        return this;
      },
      getHeaderNames() {
        return Object.keys(resHeaders);
      },
      hasHeader(name) {
        return name in resHeaders;
      },
      removeHeader(name) {
        delete resHeaders[name];
      },
      getHeaders() {
        return resHeaders;
      }
    });
    const event = createEvent(reqProxy, resProxy);
    event.context = incomingEvent.context;
    const body = await handler(event);
    const headers = event.res.getHeaders();
    headers.Etag = `W/"${hash(body)}"`;
    headers["Last-Modified"] = new Date().toUTCString();
    const cacheControl = [];
    if (opts.swr) {
      if (opts.maxAge) {
        cacheControl.push(`s-maxage=${opts.maxAge}`);
      }
      if (opts.staleMaxAge) {
        cacheControl.push(`stale-while-revalidate=${opts.staleMaxAge}`);
      } else {
        cacheControl.push("stale-while-revalidate");
      }
    } else if (opts.maxAge) {
      cacheControl.push(`max-age=${opts.maxAge}`);
    }
    if (cacheControl.length) {
      headers["Cache-Control"] = cacheControl.join(", ");
    }
    const cacheEntry = {
      code: event.res.statusCode,
      headers,
      body
    };
    return cacheEntry;
  }, _opts);
  return defineEventHandler(async (event) => {
    const response = await _cachedHandler(event);
    if (event.res.headersSent || event.res.writableEnded) {
      return response.body;
    }
    if (handleCacheHeaders(event, {
      modifiedTime: new Date(response.headers["Last-Modified"]),
      etag: response.headers.etag,
      maxAge: opts.maxAge
    })) {
      return;
    }
    event.res.statusCode = response.code;
    for (const name in response.headers) {
      event.res.setHeader(name, response.headers[name]);
    }
    return response.body;
  });
}
function cloneWithProxy(obj, overrides) {
  return new Proxy(obj, {
    get(target, property, receiver) {
      if (property in overrides) {
        return overrides[property];
      }
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      if (property in overrides) {
        overrides[property] = value;
        return true;
      }
      return Reflect.set(target, property, value, receiver);
    }
  });
}
const cachedEventHandler = defineCachedEventHandler;

const plugins = [
  
];

function hasReqHeader(req, header, includes) {
  const value = req.headers[header];
  return value && typeof value === "string" && value.toLowerCase().includes(includes);
}
function isJsonRequest(event) {
  return hasReqHeader(event.req, "accept", "application/json") || hasReqHeader(event.req, "user-agent", "curl/") || hasReqHeader(event.req, "user-agent", "httpie/") || event.req.url?.endsWith(".json") || event.req.url?.includes("/api/");
}
function normalizeError(error) {
  const cwd = process.cwd();
  const stack = (error.stack || "").split("\n").splice(1).filter((line) => line.includes("at ")).map((line) => {
    const text = line.replace(cwd + "/", "./").replace("webpack:/", "").replace("file://", "").trim();
    return {
      text,
      internal: line.includes("node_modules") && !line.includes(".cache") || line.includes("internal") || line.includes("new Promise")
    };
  });
  const statusCode = error.statusCode || 500;
  const statusMessage = error.statusMessage ?? (statusCode === 404 ? "Route Not Found" : "Internal Server Error");
  const message = error.message || error.toString();
  return {
    stack,
    statusCode,
    statusMessage,
    message
  };
}

const errorHandler = (async function errorhandler(_error, event) {
  const { stack, statusCode, statusMessage, message } = normalizeError(_error);
  const errorObject = {
    url: event.req.url,
    statusCode,
    statusMessage,
    message,
    description: "",
    data: _error.data
  };
  event.res.statusCode = errorObject.statusCode;
  event.res.statusMessage = errorObject.statusMessage;
  if (errorObject.statusCode !== 404) {
    console.error("[nuxt] [request error]", errorObject.message + "\n" + stack.map((l) => "  " + l.text).join("  \n"));
  }
  if (isJsonRequest(event)) {
    event.res.setHeader("Content-Type", "application/json");
    event.res.end(JSON.stringify(errorObject));
    return;
  }
  const url = withQuery("/__nuxt_error", errorObject);
  const html = await $fetch(url).catch((error) => {
    console.error("[nitro] Error while generating error response", error);
    return errorObject.statusMessage;
  });
  event.res.setHeader("Content-Type", "text/html;charset=UTF-8");
  event.res.end(html);
});

const assets = {
  "/_nuxt/404-1063ca59.mjs": {
    "type": "application/javascript",
    "etag": "\"405-SM89Wvqza7BC7DgE3LvHTd2/wbU\"",
    "mtime": "2022-06-01T18:50:09.686Z",
    "path": "../public/_nuxt/404-1063ca59.mjs"
  },
  "/_nuxt/calculate-active-index-9bbbbe55.mjs": {
    "type": "application/javascript",
    "etag": "\"335-M4Ep5FtT23eljsgA7eXLYV8lv1U\"",
    "mtime": "2022-06-01T18:50:09.682Z",
    "path": "../public/_nuxt/calculate-active-index-9bbbbe55.mjs"
  },
  "/_nuxt/Card-91ce4c84.mjs": {
    "type": "application/javascript",
    "etag": "\"ff-NVUu+c4PFqA88H4mInklkA3E5Us\"",
    "mtime": "2022-06-01T18:50:09.681Z",
    "path": "../public/_nuxt/Card-91ce4c84.mjs"
  },
  "/_nuxt/CardList-310f089d.mjs": {
    "type": "application/javascript",
    "etag": "\"599-E68KD5C8hb9Pu8EU6PD1lThsI9E\"",
    "mtime": "2022-06-01T18:50:09.682Z",
    "path": "../public/_nuxt/CardList-310f089d.mjs"
  },
  "/_nuxt/combobox-e1755cc8.mjs": {
    "type": "application/javascript",
    "etag": "\"330d-SuXojYmfyTYvYlrXSXFKQdK0uek\"",
    "mtime": "2022-06-01T18:50:09.682Z",
    "path": "../public/_nuxt/combobox-e1755cc8.mjs"
  },
  "/_nuxt/description-51b8c232.mjs": {
    "type": "application/javascript",
    "etag": "\"595-Ju6SunRnd+4PmgznsDHs8IKcgeU\"",
    "mtime": "2022-06-01T18:50:09.683Z",
    "path": "../public/_nuxt/description-51b8c232.mjs"
  },
  "/_nuxt/dialog-40f8a7e7.mjs": {
    "type": "application/javascript",
    "etag": "\"1d3c-NKoOAQn3S/HqvqKX9fLyTq1SnyQ\"",
    "mtime": "2022-06-01T18:50:09.683Z",
    "path": "../public/_nuxt/dialog-40f8a7e7.mjs"
  },
  "/_nuxt/disclosure-7db100d2.mjs": {
    "type": "application/javascript",
    "etag": "\"ef1-dnGS/8QkHUiRt8raV6DtmLRG62c\"",
    "mtime": "2022-06-01T18:50:09.684Z",
    "path": "../public/_nuxt/disclosure-7db100d2.mjs"
  },
  "/_nuxt/dom-0d1fce75.mjs": {
    "type": "application/javascript",
    "etag": "\"65-859yVoouADl5zywVMqzXHl7/oiI\"",
    "mtime": "2022-06-01T18:50:09.683Z",
    "path": "../public/_nuxt/dom-0d1fce75.mjs"
  },
  "/_nuxt/entry-fba3770b.mjs": {
    "type": "application/javascript",
    "etag": "\"2268e-MNVimI1UOz9zkk6oyQgrzq8+5EU\"",
    "mtime": "2022-06-01T18:50:09.682Z",
    "path": "../public/_nuxt/entry-fba3770b.mjs"
  },
  "/_nuxt/entry.5d0775a5.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"4dfc-y/nSFT79844szYizy3PyqdERjTU\"",
    "mtime": "2022-06-01T18:50:09.687Z",
    "path": "../public/_nuxt/entry.5d0775a5.css"
  },
  "/_nuxt/focus-management-c0b49fb2.mjs": {
    "type": "application/javascript",
    "etag": "\"8e6-05zKLJed7HkaCuMezEL1acPE5Uc\"",
    "mtime": "2022-06-01T18:50:09.683Z",
    "path": "../public/_nuxt/focus-management-c0b49fb2.mjs"
  },
  "/_nuxt/focus-trap-ec037f13.mjs": {
    "type": "application/javascript",
    "etag": "\"4da-9WGIzZhQQOzxhGMHW3/50Bi8bZo\"",
    "mtime": "2022-06-01T18:50:09.683Z",
    "path": "../public/_nuxt/focus-trap-ec037f13.mjs"
  },
  "/_nuxt/form-fca0fae1.mjs": {
    "type": "application/javascript",
    "etag": "\"2ac-8kZSY1HcgS3pq/Ilo/XpZF1Je8w\"",
    "mtime": "2022-06-01T18:50:09.683Z",
    "path": "../public/_nuxt/form-fca0fae1.mjs"
  },
  "/_nuxt/index-a811ed92.mjs": {
    "type": "application/javascript",
    "etag": "\"a1-qZZ3GXGWxfdGxgB47t11P18ScQA\"",
    "mtime": "2022-06-01T18:50:09.686Z",
    "path": "../public/_nuxt/index-a811ed92.mjs"
  },
  "/_nuxt/keyboard-b81851fc.mjs": {
    "type": "application/javascript",
    "etag": "\"125-RcMU/tnL+3al+2XOzG8FAI2qeBs\"",
    "mtime": "2022-06-01T18:50:09.682Z",
    "path": "../public/_nuxt/keyboard-b81851fc.mjs"
  },
  "/_nuxt/label-9651889d.mjs": {
    "type": "application/javascript",
    "etag": "\"6d1-PnqpcUJwrCPwUujF3M13y9GloIo\"",
    "mtime": "2022-06-01T18:50:09.684Z",
    "path": "../public/_nuxt/label-9651889d.mjs"
  },
  "/_nuxt/Layout-447c6d82.mjs": {
    "type": "application/javascript",
    "etag": "\"130-z41OLR68DcNt3ScFlmVK3YemZNw\"",
    "mtime": "2022-06-01T18:50:09.682Z",
    "path": "../public/_nuxt/Layout-447c6d82.mjs"
  },
  "/_nuxt/listbox-46c6526e.mjs": {
    "type": "application/javascript",
    "etag": "\"29d9-TKOumNKmPU8ptxGbfmnBgFVfmhI\"",
    "mtime": "2022-06-01T18:50:09.684Z",
    "path": "../public/_nuxt/listbox-46c6526e.mjs"
  },
  "/_nuxt/manifest.json": {
    "type": "application/json",
    "etag": "\"3ebc-tDG5ZKose/PmmFHCs84LZcWMDXE\"",
    "mtime": "2022-06-01T18:50:09.688Z",
    "path": "../public/_nuxt/manifest.json"
  },
  "/_nuxt/menu-87c86580.mjs": {
    "type": "application/javascript",
    "etag": "\"1fa1-Db5rxmli0GDJFRwKBBmxz2q/bNE\"",
    "mtime": "2022-06-01T18:50:09.684Z",
    "path": "../public/_nuxt/menu-87c86580.mjs"
  },
  "/_nuxt/my-db67c019.mjs": {
    "type": "application/javascript",
    "etag": "\"21d8-15UAFxhBT7kCbpnmgZvU6cCy0tQ\"",
    "mtime": "2022-06-01T18:50:09.686Z",
    "path": "../public/_nuxt/my-db67c019.mjs"
  },
  "/_nuxt/open-closed-5740cd5c.mjs": {
    "type": "application/javascript",
    "etag": "\"ff-oEmx7qQVQaqJcXbNV8KCphPLonU\"",
    "mtime": "2022-06-01T18:50:09.682Z",
    "path": "../public/_nuxt/open-closed-5740cd5c.mjs"
  },
  "/_nuxt/owner-f2792c55.mjs": {
    "type": "application/javascript",
    "etag": "\"f9-MK5rrG4GUnu4bv5RP4YBueW5JuY\"",
    "mtime": "2022-06-01T18:50:09.683Z",
    "path": "../public/_nuxt/owner-f2792c55.mjs"
  },
  "/_nuxt/popover-b2067f11.mjs": {
    "type": "application/javascript",
    "etag": "\"225c-PAdypLMQ4JvmFb7kn5Y4t7/SphM\"",
    "mtime": "2022-06-01T18:50:09.684Z",
    "path": "../public/_nuxt/popover-b2067f11.mjs"
  },
  "/_nuxt/portal-8f9b8785.mjs": {
    "type": "application/javascript",
    "etag": "\"960-VVvy5QNBKhEBod3eE/sOGR4os9Q\"",
    "mtime": "2022-06-01T18:50:09.683Z",
    "path": "../public/_nuxt/portal-8f9b8785.mjs"
  },
  "/_nuxt/radio-group-807ce67d.mjs": {
    "type": "application/javascript",
    "etag": "\"14ee-X5T1Pp11/k/Bjkb25lKe9VcYAWI\"",
    "mtime": "2022-06-01T18:50:09.684Z",
    "path": "../public/_nuxt/radio-group-807ce67d.mjs"
  },
  "/_nuxt/render-04a01df5.mjs": {
    "type": "application/javascript",
    "etag": "\"a19-yjcJiskPppeg33jHGA2E+xEq6Dk\"",
    "mtime": "2022-06-01T18:50:09.682Z",
    "path": "../public/_nuxt/render-04a01df5.mjs"
  },
  "/_nuxt/switch-24078854.mjs": {
    "type": "application/javascript",
    "etag": "\"a59-OEuchko/5IvEK/HvO+doiQqvbr8\"",
    "mtime": "2022-06-01T18:50:09.685Z",
    "path": "../public/_nuxt/switch-24078854.mjs"
  },
  "/_nuxt/tabs-2fc05bc1.mjs": {
    "type": "application/javascript",
    "etag": "\"16a6-Qn/w+vsn5GqVWxNPueMq8oZc35E\"",
    "mtime": "2022-06-01T18:50:09.685Z",
    "path": "../public/_nuxt/tabs-2fc05bc1.mjs"
  },
  "/_nuxt/transition-8ace8613.mjs": {
    "type": "application/javascript",
    "etag": "\"532-pFkhL0cz+gR7PWWeCjseciGQ/Dc\"",
    "mtime": "2022-06-01T18:50:09.685Z",
    "path": "../public/_nuxt/transition-8ace8613.mjs"
  },
  "/_nuxt/transition-bc1a388e.mjs": {
    "type": "application/javascript",
    "etag": "\"1640-m3AuAxH4mzoy0ORhMpACfLDqFv4\"",
    "mtime": "2022-06-01T18:50:09.685Z",
    "path": "../public/_nuxt/transition-bc1a388e.mjs"
  },
  "/_nuxt/use-event-listener-442b8502.mjs": {
    "type": "application/javascript",
    "etag": "\"c2-GcUL0UaydipdyMV/6bea0jze4WU\"",
    "mtime": "2022-06-01T18:50:09.683Z",
    "path": "../public/_nuxt/use-event-listener-442b8502.mjs"
  },
  "/_nuxt/use-focus-trap-0dc66c51.mjs": {
    "type": "application/javascript",
    "etag": "\"7f9-Qcmb7jB38L4OEOgQgpbWxDFm4MU\"",
    "mtime": "2022-06-01T18:50:09.683Z",
    "path": "../public/_nuxt/use-focus-trap-0dc66c51.mjs"
  },
  "/_nuxt/use-id-b6e0887a.mjs": {
    "type": "application/javascript",
    "etag": "\"47-d8xgKKOLkEZrQbV86cQ58dapmUo\"",
    "mtime": "2022-06-01T18:50:09.682Z",
    "path": "../public/_nuxt/use-id-b6e0887a.mjs"
  },
  "/_nuxt/use-outside-click-30e9fbf7.mjs": {
    "type": "application/javascript",
    "etag": "\"3d7-b2vbEDqMbZVwcZP3wrHYYEN8fMU\"",
    "mtime": "2022-06-01T18:50:09.684Z",
    "path": "../public/_nuxt/use-outside-click-30e9fbf7.mjs"
  },
  "/_nuxt/use-resolve-button-type-bc6e1b89.mjs": {
    "type": "application/javascript",
    "etag": "\"1c9-uMjgVlaeWp/tnz+Lplido5rNWJc\"",
    "mtime": "2022-06-01T18:50:09.682Z",
    "path": "../public/_nuxt/use-resolve-button-type-bc6e1b89.mjs"
  },
  "/_nuxt/use-tree-walker-8519e4e9.mjs": {
    "type": "application/javascript",
    "etag": "\"16d-5OZ6WTrU+WIjBqxkZgi21KzxyQA\"",
    "mtime": "2022-06-01T18:50:09.684Z",
    "path": "../public/_nuxt/use-tree-walker-8519e4e9.mjs"
  },
  "/_nuxt/visually-hidden-0af70af8.mjs": {
    "type": "application/javascript",
    "etag": "\"36b-1vyPgAlhcAZMDYGPFUnuSE+Fie4\"",
    "mtime": "2022-06-01T18:50:09.684Z",
    "path": "../public/_nuxt/visually-hidden-0af70af8.mjs"
  }
};

function readAsset (id) {
  const serverDir = dirname(fileURLToPath(globalThis._importMeta_.url));
  return promises.readFile(resolve(serverDir, assets[id].path))
}

const publicAssetBases = ["/_nuxt"];

function isPublicAssetURL(id = '') {
  if (assets[id]) {
    return
  }
  for (const base of publicAssetBases) {
    if (id.startsWith(base)) { return true }
  }
  return false
}

function getAsset (id) {
  return assets[id]
}

const METHODS = ["HEAD", "GET"];
const _152570 = eventHandler(async (event) => {
  if (event.req.method && !METHODS.includes(event.req.method)) {
    return;
  }
  let id = decodeURIComponent(withLeadingSlash(withoutTrailingSlash(parseURL(event.req.url).pathname)));
  let asset;
  for (const _id of [id, id + "/index.html"]) {
    const _asset = getAsset(_id);
    if (_asset) {
      asset = _asset;
      id = _id;
      break;
    }
  }
  if (!asset) {
    if (isPublicAssetURL(id)) {
      throw createError({
        statusMessage: "Cannot find static asset " + id,
        statusCode: 404
      });
    }
    return;
  }
  const ifNotMatch = event.req.headers["if-none-match"] === asset.etag;
  if (ifNotMatch) {
    event.res.statusCode = 304;
    event.res.end("Not Modified (etag)");
    return;
  }
  const ifModifiedSinceH = event.req.headers["if-modified-since"];
  if (ifModifiedSinceH && asset.mtime) {
    if (new Date(ifModifiedSinceH) >= new Date(asset.mtime)) {
      event.res.statusCode = 304;
      event.res.end("Not Modified (mtime)");
      return;
    }
  }
  if (asset.type) {
    event.res.setHeader("Content-Type", asset.type);
  }
  if (asset.etag) {
    event.res.setHeader("ETag", asset.etag);
  }
  if (asset.mtime) {
    event.res.setHeader("Last-Modified", asset.mtime);
  }
  const contents = await readAsset(id);
  event.res.end(contents);
});

const _lazy_119766 = () => import('./renderer.mjs').then(function (n) { return n.a; });

const handlers = [
  { route: '', handler: _152570, lazy: false, middleware: true, method: undefined },
  { route: '/__nuxt_error', handler: _lazy_119766, lazy: true, middleware: false, method: undefined },
  { route: '/**', handler: _lazy_119766, lazy: true, middleware: false, method: undefined }
];

function createNitroApp() {
  const config = useRuntimeConfig();
  const hooks = createHooks();
  const h3App = createApp({
    debug: destr(false),
    onError: errorHandler
  });
  h3App.use(config.app.baseURL, timingMiddleware);
  const router = createRouter();
  const routerOptions = createRouter$1({ routes: config.nitro.routes });
  for (const h of handlers) {
    let handler = h.lazy ? lazyEventHandler(h.handler) : h.handler;
    const referenceRoute = h.route.replace(/:\w+|\*\*/g, "_");
    const routeOptions = routerOptions.lookup(referenceRoute) || {};
    if (routeOptions.swr) {
      handler = cachedEventHandler(handler, {
        group: "nitro/routes"
      });
    }
    if (h.middleware || !h.route) {
      const middlewareBase = (config.app.baseURL + (h.route || "/")).replace(/\/+/g, "/");
      h3App.use(middlewareBase, handler);
    } else {
      router.use(h.route, handler, h.method);
    }
  }
  h3App.use(config.app.baseURL, router);
  const localCall = createCall(h3App.nodeHandler);
  const localFetch = createFetch(localCall, globalThis.fetch);
  const $fetch = createFetch$1({ fetch: localFetch, Headers, defaults: { baseURL: config.app.baseURL } });
  globalThis.$fetch = $fetch;
  const app = {
    hooks,
    h3App,
    localCall,
    localFetch
  };
  for (const plugin of plugins) {
    plugin(app);
  }
  return app;
}
const nitroApp = createNitroApp();

const cert = process.env.NITRO_SSL_CERT;
const key = process.env.NITRO_SSL_KEY;
const server = cert && key ? new Server({ key, cert }, nitroApp.h3App.nodeHandler) : new Server$1(nitroApp.h3App.nodeHandler);
const port = destr(process.env.NITRO_PORT || process.env.PORT) || 3e3;
const hostname = process.env.NITRO_HOST || process.env.HOST || "0.0.0.0";
server.listen(port, hostname, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  const protocol = cert && key ? "https" : "http";
  console.log(`Listening on ${protocol}://${hostname}:${port}${useRuntimeConfig().app.baseURL}`);
});
{
  process.on("unhandledRejection", (err) => console.error("[nitro] [dev] [unhandledRejection] " + err));
  process.on("uncaughtException", (err) => console.error("[nitro] [dev] [uncaughtException] " + err));
}
const nodeServer = {};

export { nodeServer as n, useRuntimeConfig as u };
//# sourceMappingURL=node-server.mjs.map
