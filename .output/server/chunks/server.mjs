import { v as vue_cjs_prod, s as serverRenderer, r as require$$0 } from './renderer.mjs';
import { hasProtocol, isEqual, withBase, withQuery } from 'ufo';
import { createPinia, setActivePinia } from 'pinia/dist/pinia.mjs';
import { u as useRuntimeConfig$1 } from './node-server.mjs';
import 'h3';
import 'unenv/runtime/mock/proxy';
import 'stream';
import 'node-fetch-native/polyfill';
import 'http';
import 'https';
import 'destr';
import 'ohmyfetch';
import 'radix3';
import 'unenv/runtime/fetch/index';
import 'hookable';
import 'scule';
import 'ohash';
import 'unstorage';
import 'fs';
import 'pathe';
import 'url';

var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a2, b2) => {
  for (var prop in b2 || (b2 = {}))
    if (__hasOwnProp.call(b2, prop))
      __defNormalProp(a2, prop, b2[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b2)) {
      if (__propIsEnum.call(b2, prop))
        __defNormalProp(a2, prop, b2[prop]);
    }
  return a2;
};
var __spreadProps = (a2, b2) => __defProps(a2, __getOwnPropDescs(b2));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
const suspectProtoRx = /"(?:_|\\u005[Ff])(?:_|\\u005[Ff])(?:p|\\u0070)(?:r|\\u0072)(?:o|\\u006[Ff])(?:t|\\u0074)(?:o|\\u006[Ff])(?:_|\\u005[Ff])(?:_|\\u005[Ff])"\s*:/;
const suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
const JsonSigRx = /^["{[]|^-?[0-9][0-9.]{0,14}$/;
function jsonParseTransform(key, value) {
  if (key === "__proto__" || key === "constructor") {
    return;
  }
  return value;
}
function destr(val) {
  if (typeof val !== "string") {
    return val;
  }
  const _lval = val.toLowerCase();
  if (_lval === "true") {
    return true;
  }
  if (_lval === "false") {
    return false;
  }
  if (_lval === "null") {
    return null;
  }
  if (_lval === "nan") {
    return NaN;
  }
  if (_lval === "infinity") {
    return Infinity;
  }
  if (_lval === "undefined") {
    return void 0;
  }
  if (!JsonSigRx.test(val)) {
    return val;
  }
  try {
    if (suspectProtoRx.test(val) || suspectConstructorRx.test(val)) {
      return JSON.parse(val, jsonParseTransform);
    }
    return JSON.parse(val);
  } catch (_e) {
    return val;
  }
}
class FetchError extends Error {
  constructor() {
    super(...arguments);
    this.name = "FetchError";
  }
}
function createFetchError(request, error, response) {
  let message = "";
  if (request && response) {
    message = `${response.status} ${response.statusText} (${request.toString()})`;
  }
  if (error) {
    message = `${error.message} (${message})`;
  }
  const fetchError = new FetchError(message);
  Object.defineProperty(fetchError, "request", { get() {
    return request;
  } });
  Object.defineProperty(fetchError, "response", { get() {
    return response;
  } });
  Object.defineProperty(fetchError, "data", { get() {
    return response && response._data;
  } });
  return fetchError;
}
const payloadMethods = new Set(Object.freeze(["PATCH", "POST", "PUT", "DELETE"]));
function isPayloadMethod(method = "GET") {
  return payloadMethods.has(method.toUpperCase());
}
function isJSONSerializable(val) {
  if (val === void 0) {
    return false;
  }
  const t2 = typeof val;
  if (t2 === "string" || t2 === "number" || t2 === "boolean" || t2 === null) {
    return true;
  }
  if (t2 !== "object") {
    return false;
  }
  if (Array.isArray(val)) {
    return true;
  }
  return val.constructor && val.constructor.name === "Object" || typeof val.toJSON === "function";
}
const textTypes = /* @__PURE__ */ new Set([
  "image/svg",
  "application/xml",
  "application/xhtml",
  "application/html"
]);
const JSON_RE = /^application\/(?:[\w!#$%&*`\-.^~]*\+)?json(;.+)?$/i;
function detectResponseType(_contentType = "") {
  if (!_contentType) {
    return "json";
  }
  const contentType = _contentType.split(";").shift();
  if (JSON_RE.test(contentType)) {
    return "json";
  }
  if (textTypes.has(contentType) || contentType.startsWith("text/")) {
    return "text";
  }
  return "blob";
}
const retryStatusCodes = /* @__PURE__ */ new Set([
  408,
  409,
  425,
  429,
  500,
  502,
  503,
  504
]);
function createFetch(globalOptions) {
  const { fetch: fetch2, Headers: Headers2 } = globalOptions;
  function onError(ctx) {
    if (ctx.options.retry !== false) {
      const retries = typeof ctx.options.retry === "number" ? ctx.options.retry : isPayloadMethod(ctx.options.method) ? 0 : 1;
      const responseCode = ctx.response && ctx.response.status || 500;
      if (retries > 0 && retryStatusCodes.has(responseCode)) {
        return $fetchRaw(ctx.request, __spreadProps(__spreadValues({}, ctx.options), {
          retry: retries - 1
        }));
      }
    }
    const err = createFetchError(ctx.request, ctx.error, ctx.response);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(err, $fetchRaw);
    }
    throw err;
  }
  const $fetchRaw = async function $fetchRaw2(_request, _opts = {}) {
    const ctx = {
      request: _request,
      options: __spreadValues(__spreadValues({}, globalOptions.defaults), _opts),
      response: void 0,
      error: void 0
    };
    if (ctx.options.onRequest) {
      await ctx.options.onRequest(ctx);
    }
    if (typeof ctx.request === "string") {
      if (ctx.options.baseURL) {
        ctx.request = withBase(ctx.request, ctx.options.baseURL);
      }
      if (ctx.options.params) {
        ctx.request = withQuery(ctx.request, ctx.options.params);
      }
      if (ctx.options.body && isPayloadMethod(ctx.options.method)) {
        if (isJSONSerializable(ctx.options.body)) {
          ctx.options.body = JSON.stringify(ctx.options.body);
          ctx.options.headers = new Headers2(ctx.options.headers);
          if (!ctx.options.headers.has("content-type")) {
            ctx.options.headers.set("content-type", "application/json");
          }
          if (!ctx.options.headers.has("accept")) {
            ctx.options.headers.set("accept", "application/json");
          }
        }
      }
    }
    ctx.response = await fetch2(ctx.request, ctx.options).catch(async (error) => {
      ctx.error = error;
      if (ctx.options.onRequestError) {
        await ctx.options.onRequestError(ctx);
      }
      return onError(ctx);
    });
    const responseType = (ctx.options.parseResponse ? "json" : ctx.options.responseType) || detectResponseType(ctx.response.headers.get("content-type") || "");
    if (responseType === "json") {
      const data = await ctx.response.text();
      const parseFn = ctx.options.parseResponse || destr;
      ctx.response._data = parseFn(data);
    } else {
      ctx.response._data = await ctx.response[responseType]();
    }
    if (ctx.options.onResponse) {
      await ctx.options.onResponse(ctx);
    }
    if (!ctx.response.ok) {
      if (ctx.options.onResponseError) {
        await ctx.options.onResponseError(ctx);
      }
    }
    return ctx.response.ok ? ctx.response : onError(ctx);
  };
  const $fetch2 = function $fetch22(request, opts) {
    return $fetchRaw(request, opts).then((r2) => r2._data);
  };
  $fetch2.raw = $fetchRaw;
  $fetch2.create = (defaultOptions = {}) => createFetch(__spreadProps(__spreadValues({}, globalOptions), {
    defaults: __spreadValues(__spreadValues({}, globalOptions.defaults), defaultOptions)
  }));
  return $fetch2;
}
const _globalThis$2 = function() {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw new Error("unable to locate global object");
}();
const fetch = _globalThis$2.fetch || (() => Promise.reject(new Error("[ohmyfetch] global.fetch is not supported!")));
const Headers = _globalThis$2.Headers;
const $fetch$1 = createFetch({ fetch, Headers });
const appConfig = useRuntimeConfig$1().app;
const baseURL = () => appConfig.baseURL;
function flatHooks(configHooks, hooks = {}, parentName) {
  for (const key in configHooks) {
    const subHook = configHooks[key];
    const name = parentName ? `${parentName}:${key}` : key;
    if (typeof subHook === "object" && subHook !== null) {
      flatHooks(subHook, hooks, name);
    } else if (typeof subHook === "function") {
      hooks[name] = subHook;
    }
  }
  return hooks;
}
function serialCaller(hooks, args) {
  return hooks.reduce((promise, hookFn) => promise.then(() => hookFn.apply(void 0, args)), Promise.resolve(null));
}
function parallelCaller(hooks, args) {
  return Promise.all(hooks.map((hook) => hook.apply(void 0, args)));
}
class Hookable {
  constructor() {
    this._hooks = {};
    this._deprecatedHooks = {};
    this.hook = this.hook.bind(this);
    this.callHook = this.callHook.bind(this);
    this.callHookWith = this.callHookWith.bind(this);
  }
  hook(name, fn) {
    if (!name || typeof fn !== "function") {
      return () => {
      };
    }
    const originalName = name;
    let deprecatedHookObj;
    while (this._deprecatedHooks[name]) {
      const deprecatedHook = this._deprecatedHooks[name];
      if (typeof deprecatedHook === "string") {
        deprecatedHookObj = { to: deprecatedHook };
      } else {
        deprecatedHookObj = deprecatedHook;
      }
      name = deprecatedHookObj.to;
    }
    if (deprecatedHookObj) {
      if (!deprecatedHookObj.message) {
        console.warn(`${originalName} hook has been deprecated` + (deprecatedHookObj.to ? `, please use ${deprecatedHookObj.to}` : ""));
      } else {
        console.warn(deprecatedHookObj.message);
      }
    }
    this._hooks[name] = this._hooks[name] || [];
    this._hooks[name].push(fn);
    return () => {
      if (fn) {
        this.removeHook(name, fn);
        fn = null;
      }
    };
  }
  hookOnce(name, fn) {
    let _unreg;
    let _fn = (...args) => {
      _unreg();
      _unreg = null;
      _fn = null;
      return fn(...args);
    };
    _unreg = this.hook(name, _fn);
    return _unreg;
  }
  removeHook(name, fn) {
    if (this._hooks[name]) {
      const idx = this._hooks[name].indexOf(fn);
      if (idx !== -1) {
        this._hooks[name].splice(idx, 1);
      }
      if (this._hooks[name].length === 0) {
        delete this._hooks[name];
      }
    }
  }
  deprecateHook(name, deprecated) {
    this._deprecatedHooks[name] = deprecated;
  }
  deprecateHooks(deprecatedHooks) {
    Object.assign(this._deprecatedHooks, deprecatedHooks);
  }
  addHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    const removeFns = Object.keys(hooks).map((key) => this.hook(key, hooks[key]));
    return () => {
      removeFns.splice(0, removeFns.length).forEach((unreg) => unreg());
    };
  }
  removeHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    for (const key in hooks) {
      this.removeHook(key, hooks[key]);
    }
  }
  callHook(name, ...args) {
    return serialCaller(this._hooks[name] || [], args);
  }
  callHookParallel(name, ...args) {
    return parallelCaller(this._hooks[name] || [], args);
  }
  callHookWith(caller, name, ...args) {
    return caller(this._hooks[name] || [], args);
  }
}
function createHooks() {
  return new Hookable();
}
function createContext() {
  let currentInstance = null;
  let isSingleton = false;
  const checkConflict = (instance) => {
    if (currentInstance && currentInstance !== instance) {
      throw new Error("Context conflict");
    }
  };
  return {
    use: () => currentInstance,
    set: (instance, replace) => {
      if (!replace) {
        checkConflict(instance);
      }
      currentInstance = instance;
      isSingleton = true;
    },
    unset: () => {
      currentInstance = null;
      isSingleton = false;
    },
    call: (instance, cb) => {
      checkConflict(instance);
      currentInstance = instance;
      try {
        return cb();
      } finally {
        if (!isSingleton) {
          currentInstance = null;
        }
      }
    },
    async callAsync(instance, cb) {
      currentInstance = instance;
      const onRestore = () => {
        currentInstance = instance;
      };
      const onLeave = () => currentInstance === instance ? onRestore : void 0;
      asyncHandlers.add(onLeave);
      try {
        const r2 = cb();
        if (!isSingleton) {
          currentInstance = null;
        }
        return await r2;
      } finally {
        asyncHandlers.delete(onLeave);
      }
    }
  };
}
function createNamespace() {
  const contexts = {};
  return {
    get(key) {
      if (!contexts[key]) {
        contexts[key] = createContext();
      }
      contexts[key];
      return contexts[key];
    }
  };
}
const _globalThis$1 = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : {};
const globalKey$1 = "__unctx__";
const defaultNamespace = _globalThis$1[globalKey$1] || (_globalThis$1[globalKey$1] = createNamespace());
const getContext = (key) => defaultNamespace.get(key);
const asyncHandlersKey = "__unctx_async_handlers__";
const asyncHandlers = _globalThis$1[asyncHandlersKey] || (_globalThis$1[asyncHandlersKey] = /* @__PURE__ */ new Set());
function createMock(name, overrides = {}) {
  const fn = function() {
  };
  fn.prototype.name = name;
  const props = {};
  return new Proxy(fn, {
    get(_target, prop) {
      if (prop === "caller") {
        return null;
      }
      if (prop === "__createMock__") {
        return createMock;
      }
      if (prop in overrides) {
        return overrides[prop];
      }
      return props[prop] = props[prop] || createMock(`${name}.${prop.toString()}`);
    },
    apply(_target, _this, _args) {
      return createMock(`${name}()`);
    },
    construct(_target, _args, _newT) {
      return createMock(`[${name}]`);
    },
    enumerate(_target) {
      return [];
    }
  });
}
const mockContext = createMock("mock");
function mock(warning) {
  console.warn(warning);
  return mockContext;
}
const unsupported = /* @__PURE__ */ new Set([
  "store",
  "spa",
  "fetchCounters"
]);
const todo = /* @__PURE__ */ new Set([
  "isHMR",
  "base",
  "payload",
  "from",
  "next",
  "error",
  "redirect",
  "redirected",
  "enablePreview",
  "$preview",
  "beforeNuxtRender",
  "beforeSerialize"
]);
const routerKeys = ["route", "params", "query"];
const staticFlags = {
  isClient: false,
  isServer: true,
  isDev: false,
  isStatic: void 0,
  target: "server",
  modern: false
};
const legacyPlugin = (nuxtApp) => {
  nuxtApp._legacyContext = new Proxy(nuxtApp, {
    get(nuxt, p2) {
      if (unsupported.has(p2)) {
        return mock(`Accessing ${p2} is not supported in Nuxt 3.`);
      }
      if (todo.has(p2)) {
        return mock(`Accessing ${p2} is not yet supported in Nuxt 3.`);
      }
      if (routerKeys.includes(p2)) {
        if (!("$router" in nuxtApp)) {
          return mock("vue-router is not being used in this project.");
        }
        switch (p2) {
          case "route":
            return nuxt.$router.currentRoute.value;
          case "params":
          case "query":
            return nuxt.$router.currentRoute.value[p2];
        }
      }
      if (p2 === "$config" || p2 === "env") {
        return useRuntimeConfig();
      }
      if (p2 in staticFlags) {
        return staticFlags[p2];
      }
      if (p2 === "ssrContext") {
        return nuxt._legacyContext;
      }
      if (nuxt.ssrContext && p2 in nuxt.ssrContext) {
        return nuxt.ssrContext[p2];
      }
      if (p2 === "nuxt") {
        return nuxt.payload;
      }
      if (p2 === "nuxtState") {
        return nuxt.payload.data;
      }
      if (p2 in nuxtApp.vueApp) {
        return nuxtApp.vueApp[p2];
      }
      if (p2 in nuxtApp) {
        return nuxtApp[p2];
      }
      return mock(`Accessing ${p2} is not supported in Nuxt3.`);
    }
  });
};
const nuxtAppCtx = getContext("nuxt-app");
const NuxtPluginIndicator = "__nuxt_plugin";
function createNuxtApp(options) {
  const nuxtApp = __spreadValues({
    provide: void 0,
    globalName: "nuxt",
    payload: vue_cjs_prod.reactive(__spreadValues({
      data: {},
      state: {},
      _errors: {}
    }, { serverRendered: true })),
    isHydrating: false,
    _asyncDataPromises: {}
  }, options);
  nuxtApp.hooks = createHooks();
  nuxtApp.hook = nuxtApp.hooks.hook;
  nuxtApp.callHook = nuxtApp.hooks.callHook;
  nuxtApp.provide = (name, value) => {
    const $name = "$" + name;
    defineGetter(nuxtApp, $name, value);
    defineGetter(nuxtApp.vueApp.config.globalProperties, $name, value);
  };
  defineGetter(nuxtApp.vueApp, "$nuxt", nuxtApp);
  defineGetter(nuxtApp.vueApp.config.globalProperties, "$nuxt", nuxtApp);
  if (nuxtApp.ssrContext) {
    nuxtApp.ssrContext.nuxt = nuxtApp;
  }
  {
    nuxtApp.ssrContext = nuxtApp.ssrContext || {};
    nuxtApp.ssrContext.payload = nuxtApp.payload;
  }
  {
    nuxtApp.payload.config = {
      public: options.ssrContext.runtimeConfig.public,
      app: options.ssrContext.runtimeConfig.app
    };
  }
  const runtimeConfig = options.ssrContext.runtimeConfig;
  const compatibilityConfig = new Proxy(runtimeConfig, {
    get(target, prop) {
      var _a2;
      if (prop === "public") {
        return target.public;
      }
      return (_a2 = target[prop]) != null ? _a2 : target.public[prop];
    },
    set(target, prop, value) {
      {
        return false;
      }
    }
  });
  nuxtApp.provide("config", compatibilityConfig);
  return nuxtApp;
}
async function applyPlugin(nuxtApp, plugin) {
  if (typeof plugin !== "function") {
    return;
  }
  const { provide: provide2 } = await callWithNuxt(nuxtApp, plugin, [nuxtApp]) || {};
  if (provide2 && typeof provide2 === "object") {
    for (const key in provide2) {
      nuxtApp.provide(key, provide2[key]);
    }
  }
}
async function applyPlugins(nuxtApp, plugins2) {
  for (const plugin of plugins2) {
    await applyPlugin(nuxtApp, plugin);
  }
}
function normalizePlugins(_plugins2) {
  let needsLegacyContext = false;
  const plugins2 = _plugins2.map((plugin) => {
    if (typeof plugin !== "function") {
      return () => {
      };
    }
    if (isLegacyPlugin(plugin)) {
      needsLegacyContext = true;
      return (nuxtApp) => plugin(nuxtApp._legacyContext, nuxtApp.provide);
    }
    return plugin;
  });
  if (needsLegacyContext) {
    plugins2.unshift(legacyPlugin);
  }
  return plugins2;
}
function defineNuxtPlugin(plugin) {
  plugin[NuxtPluginIndicator] = true;
  return plugin;
}
function isLegacyPlugin(plugin) {
  return !plugin[NuxtPluginIndicator];
}
function callWithNuxt(nuxt, setup, args) {
  const fn = () => args ? setup(...args) : setup();
  {
    return nuxtAppCtx.callAsync(nuxt, fn);
  }
}
function useNuxtApp() {
  const vm = vue_cjs_prod.getCurrentInstance();
  if (!vm) {
    const nuxtAppInstance = nuxtAppCtx.use();
    if (!nuxtAppInstance) {
      throw new Error("nuxt instance unavailable");
    }
    return nuxtAppInstance;
  }
  return vm.appContext.app.$nuxt;
}
function useRuntimeConfig() {
  return useNuxtApp().$config;
}
function defineGetter(obj, key, val) {
  Object.defineProperty(obj, key, { get: () => val });
}
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
var vueRouter_cjs_prod = {};
/*!
  * vue-router v4.0.15
  * (c) 2022 Eduardo San Martin Morote
  * @license MIT
  */
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  var vue = require$$0;
  const hasSymbol = typeof Symbol === "function" && typeof Symbol.toStringTag === "symbol";
  const PolySymbol = (name) => hasSymbol ? Symbol(name) : "_vr_" + name;
  const matchedRouteKey = /* @__PURE__ */ PolySymbol("rvlm");
  const viewDepthKey = /* @__PURE__ */ PolySymbol("rvd");
  const routerKey = /* @__PURE__ */ PolySymbol("r");
  const routeLocationKey = /* @__PURE__ */ PolySymbol("rl");
  const routerViewLocationKey = /* @__PURE__ */ PolySymbol("rvl");
  function isESModule(obj) {
    return obj.__esModule || hasSymbol && obj[Symbol.toStringTag] === "Module";
  }
  const assign = Object.assign;
  function applyToParams(fn, params) {
    const newParams = {};
    for (const key in params) {
      const value = params[key];
      newParams[key] = Array.isArray(value) ? value.map(fn) : fn(value);
    }
    return newParams;
  }
  const noop = () => {
  };
  const TRAILING_SLASH_RE = /\/$/;
  const removeTrailingSlash = (path) => path.replace(TRAILING_SLASH_RE, "");
  function parseURL(parseQuery2, location2, currentLocation = "/") {
    let path, query = {}, searchString = "", hash2 = "";
    const searchPos = location2.indexOf("?");
    const hashPos = location2.indexOf("#", searchPos > -1 ? searchPos : 0);
    if (searchPos > -1) {
      path = location2.slice(0, searchPos);
      searchString = location2.slice(searchPos + 1, hashPos > -1 ? hashPos : location2.length);
      query = parseQuery2(searchString);
    }
    if (hashPos > -1) {
      path = path || location2.slice(0, hashPos);
      hash2 = location2.slice(hashPos, location2.length);
    }
    path = resolveRelativePath(path != null ? path : location2, currentLocation);
    return {
      fullPath: path + (searchString && "?") + searchString + hash2,
      path,
      query,
      hash: hash2
    };
  }
  function stringifyURL(stringifyQuery2, location2) {
    const query = location2.query ? stringifyQuery2(location2.query) : "";
    return location2.path + (query && "?") + query + (location2.hash || "");
  }
  function stripBase(pathname, base) {
    if (!base || !pathname.toLowerCase().startsWith(base.toLowerCase()))
      return pathname;
    return pathname.slice(base.length) || "/";
  }
  function isSameRouteLocation(stringifyQuery2, a2, b2) {
    const aLastIndex = a2.matched.length - 1;
    const bLastIndex = b2.matched.length - 1;
    return aLastIndex > -1 && aLastIndex === bLastIndex && isSameRouteRecord(a2.matched[aLastIndex], b2.matched[bLastIndex]) && isSameRouteLocationParams(a2.params, b2.params) && stringifyQuery2(a2.query) === stringifyQuery2(b2.query) && a2.hash === b2.hash;
  }
  function isSameRouteRecord(a2, b2) {
    return (a2.aliasOf || a2) === (b2.aliasOf || b2);
  }
  function isSameRouteLocationParams(a2, b2) {
    if (Object.keys(a2).length !== Object.keys(b2).length)
      return false;
    for (const key in a2) {
      if (!isSameRouteLocationParamsValue(a2[key], b2[key]))
        return false;
    }
    return true;
  }
  function isSameRouteLocationParamsValue(a2, b2) {
    return Array.isArray(a2) ? isEquivalentArray(a2, b2) : Array.isArray(b2) ? isEquivalentArray(b2, a2) : a2 === b2;
  }
  function isEquivalentArray(a2, b2) {
    return Array.isArray(b2) ? a2.length === b2.length && a2.every((value, i2) => value === b2[i2]) : a2.length === 1 && a2[0] === b2;
  }
  function resolveRelativePath(to, from) {
    if (to.startsWith("/"))
      return to;
    if (!to)
      return from;
    const fromSegments = from.split("/");
    const toSegments = to.split("/");
    let position = fromSegments.length - 1;
    let toPosition;
    let segment;
    for (toPosition = 0; toPosition < toSegments.length; toPosition++) {
      segment = toSegments[toPosition];
      if (position === 1 || segment === ".")
        continue;
      if (segment === "..")
        position--;
      else
        break;
    }
    return fromSegments.slice(0, position).join("/") + "/" + toSegments.slice(toPosition - (toPosition === toSegments.length ? 1 : 0)).join("/");
  }
  var NavigationType;
  (function(NavigationType2) {
    NavigationType2["pop"] = "pop";
    NavigationType2["push"] = "push";
  })(NavigationType || (NavigationType = {}));
  var NavigationDirection;
  (function(NavigationDirection2) {
    NavigationDirection2["back"] = "back";
    NavigationDirection2["forward"] = "forward";
    NavigationDirection2["unknown"] = "";
  })(NavigationDirection || (NavigationDirection = {}));
  const START = "";
  function normalizeBase(base) {
    if (!base) {
      {
        base = "/";
      }
    }
    if (base[0] !== "/" && base[0] !== "#")
      base = "/" + base;
    return removeTrailingSlash(base);
  }
  const BEFORE_HASH_RE = /^[^#]+#/;
  function createHref(base, location2) {
    return base.replace(BEFORE_HASH_RE, "#") + location2;
  }
  const computeScrollPosition = () => ({
    left: window.pageXOffset,
    top: window.pageYOffset
  });
  let createBaseLocation = () => location.protocol + "//" + location.host;
  function createCurrentLocation(base, location2) {
    const { pathname, search, hash: hash2 } = location2;
    const hashPos = base.indexOf("#");
    if (hashPos > -1) {
      let slicePos = hash2.includes(base.slice(hashPos)) ? base.slice(hashPos).length : 1;
      let pathFromHash = hash2.slice(slicePos);
      if (pathFromHash[0] !== "/")
        pathFromHash = "/" + pathFromHash;
      return stripBase(pathFromHash, "");
    }
    const path = stripBase(pathname, base);
    return path + search + hash2;
  }
  function useHistoryListeners(base, historyState, currentLocation, replace) {
    let listeners = [];
    let teardowns = [];
    let pauseState = null;
    const popStateHandler = ({ state }) => {
      const to = createCurrentLocation(base, location);
      const from = currentLocation.value;
      const fromState = historyState.value;
      let delta = 0;
      if (state) {
        currentLocation.value = to;
        historyState.value = state;
        if (pauseState && pauseState === from) {
          pauseState = null;
          return;
        }
        delta = fromState ? state.position - fromState.position : 0;
      } else {
        replace(to);
      }
      listeners.forEach((listener) => {
        listener(currentLocation.value, from, {
          delta,
          type: NavigationType.pop,
          direction: delta ? delta > 0 ? NavigationDirection.forward : NavigationDirection.back : NavigationDirection.unknown
        });
      });
    };
    function pauseListeners() {
      pauseState = currentLocation.value;
    }
    function listen(callback) {
      listeners.push(callback);
      const teardown = () => {
        const index2 = listeners.indexOf(callback);
        if (index2 > -1)
          listeners.splice(index2, 1);
      };
      teardowns.push(teardown);
      return teardown;
    }
    function beforeUnloadListener() {
      const { history: history2 } = window;
      if (!history2.state)
        return;
      history2.replaceState(assign({}, history2.state, { scroll: computeScrollPosition() }), "");
    }
    function destroy() {
      for (const teardown of teardowns)
        teardown();
      teardowns = [];
      window.removeEventListener("popstate", popStateHandler);
      window.removeEventListener("beforeunload", beforeUnloadListener);
    }
    window.addEventListener("popstate", popStateHandler);
    window.addEventListener("beforeunload", beforeUnloadListener);
    return {
      pauseListeners,
      listen,
      destroy
    };
  }
  function buildState(back, current, forward, replaced = false, computeScroll = false) {
    return {
      back,
      current,
      forward,
      replaced,
      position: window.history.length,
      scroll: computeScroll ? computeScrollPosition() : null
    };
  }
  function useHistoryStateNavigation(base) {
    const { history: history2, location: location2 } = window;
    const currentLocation = {
      value: createCurrentLocation(base, location2)
    };
    const historyState = { value: history2.state };
    if (!historyState.value) {
      changeLocation(currentLocation.value, {
        back: null,
        current: currentLocation.value,
        forward: null,
        position: history2.length - 1,
        replaced: true,
        scroll: null
      }, true);
    }
    function changeLocation(to, state, replace2) {
      const hashIndex = base.indexOf("#");
      const url = hashIndex > -1 ? (location2.host && document.querySelector("base") ? base : base.slice(hashIndex)) + to : createBaseLocation() + base + to;
      try {
        history2[replace2 ? "replaceState" : "pushState"](state, "", url);
        historyState.value = state;
      } catch (err) {
        {
          console.error(err);
        }
        location2[replace2 ? "replace" : "assign"](url);
      }
    }
    function replace(to, data) {
      const state = assign({}, history2.state, buildState(historyState.value.back, to, historyState.value.forward, true), data, { position: historyState.value.position });
      changeLocation(to, state, true);
      currentLocation.value = to;
    }
    function push(to, data) {
      const currentState = assign({}, historyState.value, history2.state, {
        forward: to,
        scroll: computeScrollPosition()
      });
      changeLocation(currentState.current, currentState, true);
      const state = assign({}, buildState(currentLocation.value, to, null), { position: currentState.position + 1 }, data);
      changeLocation(to, state, false);
      currentLocation.value = to;
    }
    return {
      location: currentLocation,
      state: historyState,
      push,
      replace
    };
  }
  function createWebHistory(base) {
    base = normalizeBase(base);
    const historyNavigation = useHistoryStateNavigation(base);
    const historyListeners = useHistoryListeners(base, historyNavigation.state, historyNavigation.location, historyNavigation.replace);
    function go(delta, triggerListeners = true) {
      if (!triggerListeners)
        historyListeners.pauseListeners();
      history.go(delta);
    }
    const routerHistory = assign({
      location: "",
      base,
      go,
      createHref: createHref.bind(null, base)
    }, historyNavigation, historyListeners);
    Object.defineProperty(routerHistory, "location", {
      enumerable: true,
      get: () => historyNavigation.location.value
    });
    Object.defineProperty(routerHistory, "state", {
      enumerable: true,
      get: () => historyNavigation.state.value
    });
    return routerHistory;
  }
  function createMemoryHistory(base = "") {
    let listeners = [];
    let queue = [START];
    let position = 0;
    base = normalizeBase(base);
    function setLocation(location2) {
      position++;
      if (position === queue.length) {
        queue.push(location2);
      } else {
        queue.splice(position);
        queue.push(location2);
      }
    }
    function triggerListeners(to, from, { direction, delta }) {
      const info = {
        direction,
        delta,
        type: NavigationType.pop
      };
      for (const callback of listeners) {
        callback(to, from, info);
      }
    }
    const routerHistory = {
      location: START,
      state: {},
      base,
      createHref: createHref.bind(null, base),
      replace(to) {
        queue.splice(position--, 1);
        setLocation(to);
      },
      push(to, data) {
        setLocation(to);
      },
      listen(callback) {
        listeners.push(callback);
        return () => {
          const index2 = listeners.indexOf(callback);
          if (index2 > -1)
            listeners.splice(index2, 1);
        };
      },
      destroy() {
        listeners = [];
        queue = [START];
        position = 0;
      },
      go(delta, shouldTrigger = true) {
        const from = this.location;
        const direction = delta < 0 ? NavigationDirection.back : NavigationDirection.forward;
        position = Math.max(0, Math.min(position + delta, queue.length - 1));
        if (shouldTrigger) {
          triggerListeners(this.location, from, {
            direction,
            delta
          });
        }
      }
    };
    Object.defineProperty(routerHistory, "location", {
      enumerable: true,
      get: () => queue[position]
    });
    return routerHistory;
  }
  function createWebHashHistory(base) {
    base = location.host ? base || location.pathname + location.search : "";
    if (!base.includes("#"))
      base += "#";
    return createWebHistory(base);
  }
  function isRouteLocation(route) {
    return typeof route === "string" || route && typeof route === "object";
  }
  function isRouteName(name) {
    return typeof name === "string" || typeof name === "symbol";
  }
  const START_LOCATION_NORMALIZED = {
    path: "/",
    name: void 0,
    params: {},
    query: {},
    hash: "",
    fullPath: "/",
    matched: [],
    meta: {},
    redirectedFrom: void 0
  };
  const NavigationFailureSymbol = /* @__PURE__ */ PolySymbol("nf");
  exports.NavigationFailureType = void 0;
  (function(NavigationFailureType) {
    NavigationFailureType[NavigationFailureType["aborted"] = 4] = "aborted";
    NavigationFailureType[NavigationFailureType["cancelled"] = 8] = "cancelled";
    NavigationFailureType[NavigationFailureType["duplicated"] = 16] = "duplicated";
  })(exports.NavigationFailureType || (exports.NavigationFailureType = {}));
  const ErrorTypeMessages = {
    [1]({ location: location2, currentLocation }) {
      return `No match for
 ${JSON.stringify(location2)}${currentLocation ? "\nwhile being at\n" + JSON.stringify(currentLocation) : ""}`;
    },
    [2]({ from, to }) {
      return `Redirected from "${from.fullPath}" to "${stringifyRoute(to)}" via a navigation guard.`;
    },
    [4]({ from, to }) {
      return `Navigation aborted from "${from.fullPath}" to "${to.fullPath}" via a navigation guard.`;
    },
    [8]({ from, to }) {
      return `Navigation cancelled from "${from.fullPath}" to "${to.fullPath}" with a new navigation.`;
    },
    [16]({ from, to }) {
      return `Avoided redundant navigation to current location: "${from.fullPath}".`;
    }
  };
  function createRouterError(type, params) {
    {
      return assign(new Error(ErrorTypeMessages[type](params)), {
        type,
        [NavigationFailureSymbol]: true
      }, params);
    }
  }
  function isNavigationFailure(error, type) {
    return error instanceof Error && NavigationFailureSymbol in error && (type == null || !!(error.type & type));
  }
  const propertiesToLog = ["params", "query", "hash"];
  function stringifyRoute(to) {
    if (typeof to === "string")
      return to;
    if ("path" in to)
      return to.path;
    const location2 = {};
    for (const key of propertiesToLog) {
      if (key in to)
        location2[key] = to[key];
    }
    return JSON.stringify(location2, null, 2);
  }
  const BASE_PARAM_PATTERN = "[^/]+?";
  const BASE_PATH_PARSER_OPTIONS = {
    sensitive: false,
    strict: false,
    start: true,
    end: true
  };
  const REGEX_CHARS_RE = /[.+*?^${}()[\]/\\]/g;
  function tokensToParser(segments, extraOptions) {
    const options = assign({}, BASE_PATH_PARSER_OPTIONS, extraOptions);
    const score = [];
    let pattern = options.start ? "^" : "";
    const keys = [];
    for (const segment of segments) {
      const segmentScores = segment.length ? [] : [90];
      if (options.strict && !segment.length)
        pattern += "/";
      for (let tokenIndex = 0; tokenIndex < segment.length; tokenIndex++) {
        const token = segment[tokenIndex];
        let subSegmentScore = 40 + (options.sensitive ? 0.25 : 0);
        if (token.type === 0) {
          if (!tokenIndex)
            pattern += "/";
          pattern += token.value.replace(REGEX_CHARS_RE, "\\$&");
          subSegmentScore += 40;
        } else if (token.type === 1) {
          const { value, repeatable, optional, regexp } = token;
          keys.push({
            name: value,
            repeatable,
            optional
          });
          const re3 = regexp ? regexp : BASE_PARAM_PATTERN;
          if (re3 !== BASE_PARAM_PATTERN) {
            subSegmentScore += 10;
            try {
              new RegExp(`(${re3})`);
            } catch (err) {
              throw new Error(`Invalid custom RegExp for param "${value}" (${re3}): ` + err.message);
            }
          }
          let subPattern = repeatable ? `((?:${re3})(?:/(?:${re3}))*)` : `(${re3})`;
          if (!tokenIndex)
            subPattern = optional && segment.length < 2 ? `(?:/${subPattern})` : "/" + subPattern;
          if (optional)
            subPattern += "?";
          pattern += subPattern;
          subSegmentScore += 20;
          if (optional)
            subSegmentScore += -8;
          if (repeatable)
            subSegmentScore += -20;
          if (re3 === ".*")
            subSegmentScore += -50;
        }
        segmentScores.push(subSegmentScore);
      }
      score.push(segmentScores);
    }
    if (options.strict && options.end) {
      const i2 = score.length - 1;
      score[i2][score[i2].length - 1] += 0.7000000000000001;
    }
    if (!options.strict)
      pattern += "/?";
    if (options.end)
      pattern += "$";
    else if (options.strict)
      pattern += "(?:/|$)";
    const re2 = new RegExp(pattern, options.sensitive ? "" : "i");
    function parse2(path) {
      const match = path.match(re2);
      const params = {};
      if (!match)
        return null;
      for (let i2 = 1; i2 < match.length; i2++) {
        const value = match[i2] || "";
        const key = keys[i2 - 1];
        params[key.name] = value && key.repeatable ? value.split("/") : value;
      }
      return params;
    }
    function stringify(params) {
      let path = "";
      let avoidDuplicatedSlash = false;
      for (const segment of segments) {
        if (!avoidDuplicatedSlash || !path.endsWith("/"))
          path += "/";
        avoidDuplicatedSlash = false;
        for (const token of segment) {
          if (token.type === 0) {
            path += token.value;
          } else if (token.type === 1) {
            const { value, repeatable, optional } = token;
            const param = value in params ? params[value] : "";
            if (Array.isArray(param) && !repeatable)
              throw new Error(`Provided param "${value}" is an array but it is not repeatable (* or + modifiers)`);
            const text = Array.isArray(param) ? param.join("/") : param;
            if (!text) {
              if (optional) {
                if (segment.length < 2 && segments.length > 1) {
                  if (path.endsWith("/"))
                    path = path.slice(0, -1);
                  else
                    avoidDuplicatedSlash = true;
                }
              } else
                throw new Error(`Missing required param "${value}"`);
            }
            path += text;
          }
        }
      }
      return path;
    }
    return {
      re: re2,
      score,
      keys,
      parse: parse2,
      stringify
    };
  }
  function compareScoreArray(a2, b2) {
    let i2 = 0;
    while (i2 < a2.length && i2 < b2.length) {
      const diff = b2[i2] - a2[i2];
      if (diff)
        return diff;
      i2++;
    }
    if (a2.length < b2.length) {
      return a2.length === 1 && a2[0] === 40 + 40 ? -1 : 1;
    } else if (a2.length > b2.length) {
      return b2.length === 1 && b2[0] === 40 + 40 ? 1 : -1;
    }
    return 0;
  }
  function comparePathParserScore(a2, b2) {
    let i2 = 0;
    const aScore = a2.score;
    const bScore = b2.score;
    while (i2 < aScore.length && i2 < bScore.length) {
      const comp = compareScoreArray(aScore[i2], bScore[i2]);
      if (comp)
        return comp;
      i2++;
    }
    return bScore.length - aScore.length;
  }
  const ROOT_TOKEN = {
    type: 0,
    value: ""
  };
  const VALID_PARAM_RE = /[a-zA-Z0-9_]/;
  function tokenizePath(path) {
    if (!path)
      return [[]];
    if (path === "/")
      return [[ROOT_TOKEN]];
    if (!path.startsWith("/")) {
      throw new Error(`Invalid path "${path}"`);
    }
    function crash(message) {
      throw new Error(`ERR (${state})/"${buffer}": ${message}`);
    }
    let state = 0;
    let previousState = state;
    const tokens = [];
    let segment;
    function finalizeSegment() {
      if (segment)
        tokens.push(segment);
      segment = [];
    }
    let i2 = 0;
    let char;
    let buffer = "";
    let customRe = "";
    function consumeBuffer() {
      if (!buffer)
        return;
      if (state === 0) {
        segment.push({
          type: 0,
          value: buffer
        });
      } else if (state === 1 || state === 2 || state === 3) {
        if (segment.length > 1 && (char === "*" || char === "+"))
          crash(`A repeatable param (${buffer}) must be alone in its segment. eg: '/:ids+.`);
        segment.push({
          type: 1,
          value: buffer,
          regexp: customRe,
          repeatable: char === "*" || char === "+",
          optional: char === "*" || char === "?"
        });
      } else {
        crash("Invalid state to consume buffer");
      }
      buffer = "";
    }
    function addCharToBuffer() {
      buffer += char;
    }
    while (i2 < path.length) {
      char = path[i2++];
      if (char === "\\" && state !== 2) {
        previousState = state;
        state = 4;
        continue;
      }
      switch (state) {
        case 0:
          if (char === "/") {
            if (buffer) {
              consumeBuffer();
            }
            finalizeSegment();
          } else if (char === ":") {
            consumeBuffer();
            state = 1;
          } else {
            addCharToBuffer();
          }
          break;
        case 4:
          addCharToBuffer();
          state = previousState;
          break;
        case 1:
          if (char === "(") {
            state = 2;
          } else if (VALID_PARAM_RE.test(char)) {
            addCharToBuffer();
          } else {
            consumeBuffer();
            state = 0;
            if (char !== "*" && char !== "?" && char !== "+")
              i2--;
          }
          break;
        case 2:
          if (char === ")") {
            if (customRe[customRe.length - 1] == "\\")
              customRe = customRe.slice(0, -1) + char;
            else
              state = 3;
          } else {
            customRe += char;
          }
          break;
        case 3:
          consumeBuffer();
          state = 0;
          if (char !== "*" && char !== "?" && char !== "+")
            i2--;
          customRe = "";
          break;
        default:
          crash("Unknown state");
          break;
      }
    }
    if (state === 2)
      crash(`Unfinished custom RegExp for param "${buffer}"`);
    consumeBuffer();
    finalizeSegment();
    return tokens;
  }
  function createRouteRecordMatcher(record, parent, options) {
    const parser = tokensToParser(tokenizePath(record.path), options);
    const matcher = assign(parser, {
      record,
      parent,
      children: [],
      alias: []
    });
    if (parent) {
      if (!matcher.record.aliasOf === !parent.record.aliasOf)
        parent.children.push(matcher);
    }
    return matcher;
  }
  function createRouterMatcher(routes2, globalOptions) {
    const matchers = [];
    const matcherMap = /* @__PURE__ */ new Map();
    globalOptions = mergeOptions({ strict: false, end: true, sensitive: false }, globalOptions);
    function getRecordMatcher(name) {
      return matcherMap.get(name);
    }
    function addRoute(record, parent, originalRecord) {
      const isRootAdd = !originalRecord;
      const mainNormalizedRecord = normalizeRouteRecord(record);
      mainNormalizedRecord.aliasOf = originalRecord && originalRecord.record;
      const options = mergeOptions(globalOptions, record);
      const normalizedRecords = [
        mainNormalizedRecord
      ];
      if ("alias" in record) {
        const aliases = typeof record.alias === "string" ? [record.alias] : record.alias;
        for (const alias of aliases) {
          normalizedRecords.push(assign({}, mainNormalizedRecord, {
            components: originalRecord ? originalRecord.record.components : mainNormalizedRecord.components,
            path: alias,
            aliasOf: originalRecord ? originalRecord.record : mainNormalizedRecord
          }));
        }
      }
      let matcher;
      let originalMatcher;
      for (const normalizedRecord of normalizedRecords) {
        const { path } = normalizedRecord;
        if (parent && path[0] !== "/") {
          const parentPath = parent.record.path;
          const connectingSlash = parentPath[parentPath.length - 1] === "/" ? "" : "/";
          normalizedRecord.path = parent.record.path + (path && connectingSlash + path);
        }
        matcher = createRouteRecordMatcher(normalizedRecord, parent, options);
        if (originalRecord) {
          originalRecord.alias.push(matcher);
        } else {
          originalMatcher = originalMatcher || matcher;
          if (originalMatcher !== matcher)
            originalMatcher.alias.push(matcher);
          if (isRootAdd && record.name && !isAliasRecord(matcher))
            removeRoute(record.name);
        }
        if ("children" in mainNormalizedRecord) {
          const children = mainNormalizedRecord.children;
          for (let i2 = 0; i2 < children.length; i2++) {
            addRoute(children[i2], matcher, originalRecord && originalRecord.children[i2]);
          }
        }
        originalRecord = originalRecord || matcher;
        insertMatcher(matcher);
      }
      return originalMatcher ? () => {
        removeRoute(originalMatcher);
      } : noop;
    }
    function removeRoute(matcherRef) {
      if (isRouteName(matcherRef)) {
        const matcher = matcherMap.get(matcherRef);
        if (matcher) {
          matcherMap.delete(matcherRef);
          matchers.splice(matchers.indexOf(matcher), 1);
          matcher.children.forEach(removeRoute);
          matcher.alias.forEach(removeRoute);
        }
      } else {
        const index2 = matchers.indexOf(matcherRef);
        if (index2 > -1) {
          matchers.splice(index2, 1);
          if (matcherRef.record.name)
            matcherMap.delete(matcherRef.record.name);
          matcherRef.children.forEach(removeRoute);
          matcherRef.alias.forEach(removeRoute);
        }
      }
    }
    function getRoutes() {
      return matchers;
    }
    function insertMatcher(matcher) {
      let i2 = 0;
      while (i2 < matchers.length && comparePathParserScore(matcher, matchers[i2]) >= 0 && (matcher.record.path !== matchers[i2].record.path || !isRecordChildOf(matcher, matchers[i2])))
        i2++;
      matchers.splice(i2, 0, matcher);
      if (matcher.record.name && !isAliasRecord(matcher))
        matcherMap.set(matcher.record.name, matcher);
    }
    function resolve(location2, currentLocation) {
      let matcher;
      let params = {};
      let path;
      let name;
      if ("name" in location2 && location2.name) {
        matcher = matcherMap.get(location2.name);
        if (!matcher)
          throw createRouterError(1, {
            location: location2
          });
        name = matcher.record.name;
        params = assign(paramsFromLocation(currentLocation.params, matcher.keys.filter((k2) => !k2.optional).map((k2) => k2.name)), location2.params);
        path = matcher.stringify(params);
      } else if ("path" in location2) {
        path = location2.path;
        matcher = matchers.find((m2) => m2.re.test(path));
        if (matcher) {
          params = matcher.parse(path);
          name = matcher.record.name;
        }
      } else {
        matcher = currentLocation.name ? matcherMap.get(currentLocation.name) : matchers.find((m2) => m2.re.test(currentLocation.path));
        if (!matcher)
          throw createRouterError(1, {
            location: location2,
            currentLocation
          });
        name = matcher.record.name;
        params = assign({}, currentLocation.params, location2.params);
        path = matcher.stringify(params);
      }
      const matched = [];
      let parentMatcher = matcher;
      while (parentMatcher) {
        matched.unshift(parentMatcher.record);
        parentMatcher = parentMatcher.parent;
      }
      return {
        name,
        path,
        params,
        matched,
        meta: mergeMetaFields(matched)
      };
    }
    routes2.forEach((route) => addRoute(route));
    return { addRoute, resolve, removeRoute, getRoutes, getRecordMatcher };
  }
  function paramsFromLocation(params, keys) {
    const newParams = {};
    for (const key of keys) {
      if (key in params)
        newParams[key] = params[key];
    }
    return newParams;
  }
  function normalizeRouteRecord(record) {
    return {
      path: record.path,
      redirect: record.redirect,
      name: record.name,
      meta: record.meta || {},
      aliasOf: void 0,
      beforeEnter: record.beforeEnter,
      props: normalizeRecordProps(record),
      children: record.children || [],
      instances: {},
      leaveGuards: /* @__PURE__ */ new Set(),
      updateGuards: /* @__PURE__ */ new Set(),
      enterCallbacks: {},
      components: "components" in record ? record.components || {} : { default: record.component }
    };
  }
  function normalizeRecordProps(record) {
    const propsObject = {};
    const props = record.props || false;
    if ("component" in record) {
      propsObject.default = props;
    } else {
      for (const name in record.components)
        propsObject[name] = typeof props === "boolean" ? props : props[name];
    }
    return propsObject;
  }
  function isAliasRecord(record) {
    while (record) {
      if (record.record.aliasOf)
        return true;
      record = record.parent;
    }
    return false;
  }
  function mergeMetaFields(matched) {
    return matched.reduce((meta2, record) => assign(meta2, record.meta), {});
  }
  function mergeOptions(defaults2, partialOptions) {
    const options = {};
    for (const key in defaults2) {
      options[key] = key in partialOptions ? partialOptions[key] : defaults2[key];
    }
    return options;
  }
  function isRecordChildOf(record, parent) {
    return parent.children.some((child) => child === record || isRecordChildOf(record, child));
  }
  const HASH_RE = /#/g;
  const AMPERSAND_RE = /&/g;
  const SLASH_RE = /\//g;
  const EQUAL_RE = /=/g;
  const IM_RE = /\?/g;
  const PLUS_RE = /\+/g;
  const ENC_BRACKET_OPEN_RE = /%5B/g;
  const ENC_BRACKET_CLOSE_RE = /%5D/g;
  const ENC_CARET_RE = /%5E/g;
  const ENC_BACKTICK_RE = /%60/g;
  const ENC_CURLY_OPEN_RE = /%7B/g;
  const ENC_PIPE_RE = /%7C/g;
  const ENC_CURLY_CLOSE_RE = /%7D/g;
  const ENC_SPACE_RE = /%20/g;
  function commonEncode(text) {
    return encodeURI("" + text).replace(ENC_PIPE_RE, "|").replace(ENC_BRACKET_OPEN_RE, "[").replace(ENC_BRACKET_CLOSE_RE, "]");
  }
  function encodeHash(text) {
    return commonEncode(text).replace(ENC_CURLY_OPEN_RE, "{").replace(ENC_CURLY_CLOSE_RE, "}").replace(ENC_CARET_RE, "^");
  }
  function encodeQueryValue(text) {
    return commonEncode(text).replace(PLUS_RE, "%2B").replace(ENC_SPACE_RE, "+").replace(HASH_RE, "%23").replace(AMPERSAND_RE, "%26").replace(ENC_BACKTICK_RE, "`").replace(ENC_CURLY_OPEN_RE, "{").replace(ENC_CURLY_CLOSE_RE, "}").replace(ENC_CARET_RE, "^");
  }
  function encodeQueryKey(text) {
    return encodeQueryValue(text).replace(EQUAL_RE, "%3D");
  }
  function encodePath(text) {
    return commonEncode(text).replace(HASH_RE, "%23").replace(IM_RE, "%3F");
  }
  function encodeParam(text) {
    return text == null ? "" : encodePath(text).replace(SLASH_RE, "%2F");
  }
  function decode2(text) {
    try {
      return decodeURIComponent("" + text);
    } catch (err) {
    }
    return "" + text;
  }
  function parseQuery(search) {
    const query = {};
    if (search === "" || search === "?")
      return query;
    const hasLeadingIM = search[0] === "?";
    const searchParams = (hasLeadingIM ? search.slice(1) : search).split("&");
    for (let i2 = 0; i2 < searchParams.length; ++i2) {
      const searchParam = searchParams[i2].replace(PLUS_RE, " ");
      const eqPos = searchParam.indexOf("=");
      const key = decode2(eqPos < 0 ? searchParam : searchParam.slice(0, eqPos));
      const value = eqPos < 0 ? null : decode2(searchParam.slice(eqPos + 1));
      if (key in query) {
        let currentValue = query[key];
        if (!Array.isArray(currentValue)) {
          currentValue = query[key] = [currentValue];
        }
        currentValue.push(value);
      } else {
        query[key] = value;
      }
    }
    return query;
  }
  function stringifyQuery(query) {
    let search = "";
    for (let key in query) {
      const value = query[key];
      key = encodeQueryKey(key);
      if (value == null) {
        if (value !== void 0) {
          search += (search.length ? "&" : "") + key;
        }
        continue;
      }
      const values = Array.isArray(value) ? value.map((v2) => v2 && encodeQueryValue(v2)) : [value && encodeQueryValue(value)];
      values.forEach((value2) => {
        if (value2 !== void 0) {
          search += (search.length ? "&" : "") + key;
          if (value2 != null)
            search += "=" + value2;
        }
      });
    }
    return search;
  }
  function normalizeQuery(query) {
    const normalizedQuery = {};
    for (const key in query) {
      const value = query[key];
      if (value !== void 0) {
        normalizedQuery[key] = Array.isArray(value) ? value.map((v2) => v2 == null ? null : "" + v2) : value == null ? value : "" + value;
      }
    }
    return normalizedQuery;
  }
  function useCallbacks() {
    let handlers2 = [];
    function add(handler) {
      handlers2.push(handler);
      return () => {
        const i2 = handlers2.indexOf(handler);
        if (i2 > -1)
          handlers2.splice(i2, 1);
      };
    }
    function reset() {
      handlers2 = [];
    }
    return {
      add,
      list: () => handlers2,
      reset
    };
  }
  function registerGuard(record, name, guard) {
    const removeFromList = () => {
      record[name].delete(guard);
    };
    vue.onUnmounted(removeFromList);
    vue.onDeactivated(removeFromList);
    vue.onActivated(() => {
      record[name].add(guard);
    });
    record[name].add(guard);
  }
  function onBeforeRouteLeave(leaveGuard) {
    const activeRecord = vue.inject(matchedRouteKey, {}).value;
    if (!activeRecord) {
      return;
    }
    registerGuard(activeRecord, "leaveGuards", leaveGuard);
  }
  function onBeforeRouteUpdate(updateGuard) {
    const activeRecord = vue.inject(matchedRouteKey, {}).value;
    if (!activeRecord) {
      return;
    }
    registerGuard(activeRecord, "updateGuards", updateGuard);
  }
  function guardToPromiseFn(guard, to, from, record, name) {
    const enterCallbackArray = record && (record.enterCallbacks[name] = record.enterCallbacks[name] || []);
    return () => new Promise((resolve, reject) => {
      const next = (valid) => {
        if (valid === false)
          reject(createRouterError(4, {
            from,
            to
          }));
        else if (valid instanceof Error) {
          reject(valid);
        } else if (isRouteLocation(valid)) {
          reject(createRouterError(2, {
            from: to,
            to: valid
          }));
        } else {
          if (enterCallbackArray && record.enterCallbacks[name] === enterCallbackArray && typeof valid === "function")
            enterCallbackArray.push(valid);
          resolve();
        }
      };
      const guardReturn = guard.call(record && record.instances[name], to, from, next);
      let guardCall = Promise.resolve(guardReturn);
      if (guard.length < 3)
        guardCall = guardCall.then(next);
      guardCall.catch((err) => reject(err));
    });
  }
  function extractComponentsGuards(matched, guardType, to, from) {
    const guards = [];
    for (const record of matched) {
      for (const name in record.components) {
        let rawComponent = record.components[name];
        if (guardType !== "beforeRouteEnter" && !record.instances[name])
          continue;
        if (isRouteComponent(rawComponent)) {
          const options = rawComponent.__vccOpts || rawComponent;
          const guard = options[guardType];
          guard && guards.push(guardToPromiseFn(guard, to, from, record, name));
        } else {
          let componentPromise = rawComponent();
          guards.push(() => componentPromise.then((resolved) => {
            if (!resolved)
              return Promise.reject(new Error(`Couldn't resolve component "${name}" at "${record.path}"`));
            const resolvedComponent = isESModule(resolved) ? resolved.default : resolved;
            record.components[name] = resolvedComponent;
            const options = resolvedComponent.__vccOpts || resolvedComponent;
            const guard = options[guardType];
            return guard && guardToPromiseFn(guard, to, from, record, name)();
          }));
        }
      }
    }
    return guards;
  }
  function isRouteComponent(component) {
    return typeof component === "object" || "displayName" in component || "props" in component || "__vccOpts" in component;
  }
  function useLink(props) {
    const router = vue.inject(routerKey);
    const currentRoute = vue.inject(routeLocationKey);
    const route = vue.computed(() => router.resolve(vue.unref(props.to)));
    const activeRecordIndex = vue.computed(() => {
      const { matched } = route.value;
      const { length } = matched;
      const routeMatched = matched[length - 1];
      const currentMatched = currentRoute.matched;
      if (!routeMatched || !currentMatched.length)
        return -1;
      const index2 = currentMatched.findIndex(isSameRouteRecord.bind(null, routeMatched));
      if (index2 > -1)
        return index2;
      const parentRecordPath = getOriginalPath(matched[length - 2]);
      return length > 1 && getOriginalPath(routeMatched) === parentRecordPath && currentMatched[currentMatched.length - 1].path !== parentRecordPath ? currentMatched.findIndex(isSameRouteRecord.bind(null, matched[length - 2])) : index2;
    });
    const isActive = vue.computed(() => activeRecordIndex.value > -1 && includesParams(currentRoute.params, route.value.params));
    const isExactActive = vue.computed(() => activeRecordIndex.value > -1 && activeRecordIndex.value === currentRoute.matched.length - 1 && isSameRouteLocationParams(currentRoute.params, route.value.params));
    function navigate(e2 = {}) {
      if (guardEvent(e2)) {
        return router[vue.unref(props.replace) ? "replace" : "push"](vue.unref(props.to)).catch(noop);
      }
      return Promise.resolve();
    }
    return {
      route,
      href: vue.computed(() => route.value.href),
      isActive,
      isExactActive,
      navigate
    };
  }
  const RouterLinkImpl = /* @__PURE__ */ vue.defineComponent({
    name: "RouterLink",
    props: {
      to: {
        type: [String, Object],
        required: true
      },
      replace: Boolean,
      activeClass: String,
      exactActiveClass: String,
      custom: Boolean,
      ariaCurrentValue: {
        type: String,
        default: "page"
      }
    },
    useLink,
    setup(props, { slots }) {
      const link = vue.reactive(useLink(props));
      const { options } = vue.inject(routerKey);
      const elClass = vue.computed(() => ({
        [getLinkClass(props.activeClass, options.linkActiveClass, "router-link-active")]: link.isActive,
        [getLinkClass(props.exactActiveClass, options.linkExactActiveClass, "router-link-exact-active")]: link.isExactActive
      }));
      return () => {
        const children = slots.default && slots.default(link);
        return props.custom ? children : vue.h("a", {
          "aria-current": link.isExactActive ? props.ariaCurrentValue : null,
          href: link.href,
          onClick: link.navigate,
          class: elClass.value
        }, children);
      };
    }
  });
  const RouterLink = RouterLinkImpl;
  function guardEvent(e2) {
    if (e2.metaKey || e2.altKey || e2.ctrlKey || e2.shiftKey)
      return;
    if (e2.defaultPrevented)
      return;
    if (e2.button !== void 0 && e2.button !== 0)
      return;
    if (e2.currentTarget && e2.currentTarget.getAttribute) {
      const target = e2.currentTarget.getAttribute("target");
      if (/\b_blank\b/i.test(target))
        return;
    }
    if (e2.preventDefault)
      e2.preventDefault();
    return true;
  }
  function includesParams(outer, inner) {
    for (const key in inner) {
      const innerValue = inner[key];
      const outerValue = outer[key];
      if (typeof innerValue === "string") {
        if (innerValue !== outerValue)
          return false;
      } else {
        if (!Array.isArray(outerValue) || outerValue.length !== innerValue.length || innerValue.some((value, i2) => value !== outerValue[i2]))
          return false;
      }
    }
    return true;
  }
  function getOriginalPath(record) {
    return record ? record.aliasOf ? record.aliasOf.path : record.path : "";
  }
  const getLinkClass = (propClass, globalClass, defaultClass) => propClass != null ? propClass : globalClass != null ? globalClass : defaultClass;
  const RouterViewImpl = /* @__PURE__ */ vue.defineComponent({
    name: "RouterView",
    inheritAttrs: false,
    props: {
      name: {
        type: String,
        default: "default"
      },
      route: Object
    },
    compatConfig: { MODE: 3 },
    setup(props, { attrs, slots }) {
      const injectedRoute = vue.inject(routerViewLocationKey);
      const routeToDisplay = vue.computed(() => props.route || injectedRoute.value);
      const depth = vue.inject(viewDepthKey, 0);
      const matchedRouteRef = vue.computed(() => routeToDisplay.value.matched[depth]);
      vue.provide(viewDepthKey, depth + 1);
      vue.provide(matchedRouteKey, matchedRouteRef);
      vue.provide(routerViewLocationKey, routeToDisplay);
      const viewRef = vue.ref();
      vue.watch(() => [viewRef.value, matchedRouteRef.value, props.name], ([instance, to, name], [oldInstance, from, oldName]) => {
        if (to) {
          to.instances[name] = instance;
          if (from && from !== to && instance && instance === oldInstance) {
            if (!to.leaveGuards.size) {
              to.leaveGuards = from.leaveGuards;
            }
            if (!to.updateGuards.size) {
              to.updateGuards = from.updateGuards;
            }
          }
        }
        if (instance && to && (!from || !isSameRouteRecord(to, from) || !oldInstance)) {
          (to.enterCallbacks[name] || []).forEach((callback) => callback(instance));
        }
      }, { flush: "post" });
      return () => {
        const route = routeToDisplay.value;
        const matchedRoute = matchedRouteRef.value;
        const ViewComponent = matchedRoute && matchedRoute.components[props.name];
        const currentName = props.name;
        if (!ViewComponent) {
          return normalizeSlot(slots.default, { Component: ViewComponent, route });
        }
        const routePropsOption = matchedRoute.props[props.name];
        const routeProps = routePropsOption ? routePropsOption === true ? route.params : typeof routePropsOption === "function" ? routePropsOption(route) : routePropsOption : null;
        const onVnodeUnmounted = (vnode) => {
          if (vnode.component.isUnmounted) {
            matchedRoute.instances[currentName] = null;
          }
        };
        const component = vue.h(ViewComponent, assign({}, routeProps, attrs, {
          onVnodeUnmounted,
          ref: viewRef
        }));
        return normalizeSlot(slots.default, { Component: component, route }) || component;
      };
    }
  });
  function normalizeSlot(slot, data) {
    if (!slot)
      return null;
    const slotContent = slot(data);
    return slotContent.length === 1 ? slotContent[0] : slotContent;
  }
  const RouterView = RouterViewImpl;
  function createRouter(options) {
    const matcher = createRouterMatcher(options.routes, options);
    const parseQuery$1 = options.parseQuery || parseQuery;
    const stringifyQuery$1 = options.stringifyQuery || stringifyQuery;
    const routerHistory = options.history;
    const beforeGuards = useCallbacks();
    const beforeResolveGuards = useCallbacks();
    const afterGuards = useCallbacks();
    const currentRoute = vue.shallowRef(START_LOCATION_NORMALIZED);
    let pendingLocation = START_LOCATION_NORMALIZED;
    const normalizeParams = applyToParams.bind(null, (paramValue) => "" + paramValue);
    const encodeParams = applyToParams.bind(null, encodeParam);
    const decodeParams = applyToParams.bind(null, decode2);
    function addRoute(parentOrRoute, route) {
      let parent;
      let record;
      if (isRouteName(parentOrRoute)) {
        parent = matcher.getRecordMatcher(parentOrRoute);
        record = route;
      } else {
        record = parentOrRoute;
      }
      return matcher.addRoute(record, parent);
    }
    function removeRoute(name) {
      const recordMatcher = matcher.getRecordMatcher(name);
      if (recordMatcher) {
        matcher.removeRoute(recordMatcher);
      }
    }
    function getRoutes() {
      return matcher.getRoutes().map((routeMatcher) => routeMatcher.record);
    }
    function hasRoute(name) {
      return !!matcher.getRecordMatcher(name);
    }
    function resolve(rawLocation, currentLocation) {
      currentLocation = assign({}, currentLocation || currentRoute.value);
      if (typeof rawLocation === "string") {
        const locationNormalized = parseURL(parseQuery$1, rawLocation, currentLocation.path);
        const matchedRoute2 = matcher.resolve({ path: locationNormalized.path }, currentLocation);
        const href2 = routerHistory.createHref(locationNormalized.fullPath);
        return assign(locationNormalized, matchedRoute2, {
          params: decodeParams(matchedRoute2.params),
          hash: decode2(locationNormalized.hash),
          redirectedFrom: void 0,
          href: href2
        });
      }
      let matcherLocation;
      if ("path" in rawLocation) {
        matcherLocation = assign({}, rawLocation, {
          path: parseURL(parseQuery$1, rawLocation.path, currentLocation.path).path
        });
      } else {
        const targetParams = assign({}, rawLocation.params);
        for (const key in targetParams) {
          if (targetParams[key] == null) {
            delete targetParams[key];
          }
        }
        matcherLocation = assign({}, rawLocation, {
          params: encodeParams(rawLocation.params)
        });
        currentLocation.params = encodeParams(currentLocation.params);
      }
      const matchedRoute = matcher.resolve(matcherLocation, currentLocation);
      const hash2 = rawLocation.hash || "";
      matchedRoute.params = normalizeParams(decodeParams(matchedRoute.params));
      const fullPath = stringifyURL(stringifyQuery$1, assign({}, rawLocation, {
        hash: encodeHash(hash2),
        path: matchedRoute.path
      }));
      const href = routerHistory.createHref(fullPath);
      return assign({
        fullPath,
        hash: hash2,
        query: stringifyQuery$1 === stringifyQuery ? normalizeQuery(rawLocation.query) : rawLocation.query || {}
      }, matchedRoute, {
        redirectedFrom: void 0,
        href
      });
    }
    function locationAsObject(to) {
      return typeof to === "string" ? parseURL(parseQuery$1, to, currentRoute.value.path) : assign({}, to);
    }
    function checkCanceledNavigation(to, from) {
      if (pendingLocation !== to) {
        return createRouterError(8, {
          from,
          to
        });
      }
    }
    function push(to) {
      return pushWithRedirect(to);
    }
    function replace(to) {
      return push(assign(locationAsObject(to), { replace: true }));
    }
    function handleRedirectRecord(to) {
      const lastMatched = to.matched[to.matched.length - 1];
      if (lastMatched && lastMatched.redirect) {
        const { redirect } = lastMatched;
        let newTargetLocation = typeof redirect === "function" ? redirect(to) : redirect;
        if (typeof newTargetLocation === "string") {
          newTargetLocation = newTargetLocation.includes("?") || newTargetLocation.includes("#") ? newTargetLocation = locationAsObject(newTargetLocation) : { path: newTargetLocation };
          newTargetLocation.params = {};
        }
        return assign({
          query: to.query,
          hash: to.hash,
          params: to.params
        }, newTargetLocation);
      }
    }
    function pushWithRedirect(to, redirectedFrom) {
      const targetLocation = pendingLocation = resolve(to);
      const from = currentRoute.value;
      const data = to.state;
      const force = to.force;
      const replace2 = to.replace === true;
      const shouldRedirect = handleRedirectRecord(targetLocation);
      if (shouldRedirect)
        return pushWithRedirect(assign(locationAsObject(shouldRedirect), {
          state: data,
          force,
          replace: replace2
        }), redirectedFrom || targetLocation);
      const toLocation = targetLocation;
      toLocation.redirectedFrom = redirectedFrom;
      let failure;
      if (!force && isSameRouteLocation(stringifyQuery$1, from, targetLocation)) {
        failure = createRouterError(16, { to: toLocation, from });
        handleScroll();
      }
      return (failure ? Promise.resolve(failure) : navigate(toLocation, from)).catch((error) => isNavigationFailure(error) ? isNavigationFailure(error, 2) ? error : markAsReady(error) : triggerError(error, toLocation, from)).then((failure2) => {
        if (failure2) {
          if (isNavigationFailure(failure2, 2)) {
            return pushWithRedirect(assign(locationAsObject(failure2.to), {
              state: data,
              force,
              replace: replace2
            }), redirectedFrom || toLocation);
          }
        } else {
          failure2 = finalizeNavigation(toLocation, from, true, replace2, data);
        }
        triggerAfterEach(toLocation, from, failure2);
        return failure2;
      });
    }
    function checkCanceledNavigationAndReject(to, from) {
      const error = checkCanceledNavigation(to, from);
      return error ? Promise.reject(error) : Promise.resolve();
    }
    function navigate(to, from) {
      let guards;
      const [leavingRecords, updatingRecords, enteringRecords] = extractChangingRecords(to, from);
      guards = extractComponentsGuards(leavingRecords.reverse(), "beforeRouteLeave", to, from);
      for (const record of leavingRecords) {
        record.leaveGuards.forEach((guard) => {
          guards.push(guardToPromiseFn(guard, to, from));
        });
      }
      const canceledNavigationCheck = checkCanceledNavigationAndReject.bind(null, to, from);
      guards.push(canceledNavigationCheck);
      return runGuardQueue(guards).then(() => {
        guards = [];
        for (const guard of beforeGuards.list()) {
          guards.push(guardToPromiseFn(guard, to, from));
        }
        guards.push(canceledNavigationCheck);
        return runGuardQueue(guards);
      }).then(() => {
        guards = extractComponentsGuards(updatingRecords, "beforeRouteUpdate", to, from);
        for (const record of updatingRecords) {
          record.updateGuards.forEach((guard) => {
            guards.push(guardToPromiseFn(guard, to, from));
          });
        }
        guards.push(canceledNavigationCheck);
        return runGuardQueue(guards);
      }).then(() => {
        guards = [];
        for (const record of to.matched) {
          if (record.beforeEnter && !from.matched.includes(record)) {
            if (Array.isArray(record.beforeEnter)) {
              for (const beforeEnter of record.beforeEnter)
                guards.push(guardToPromiseFn(beforeEnter, to, from));
            } else {
              guards.push(guardToPromiseFn(record.beforeEnter, to, from));
            }
          }
        }
        guards.push(canceledNavigationCheck);
        return runGuardQueue(guards);
      }).then(() => {
        to.matched.forEach((record) => record.enterCallbacks = {});
        guards = extractComponentsGuards(enteringRecords, "beforeRouteEnter", to, from);
        guards.push(canceledNavigationCheck);
        return runGuardQueue(guards);
      }).then(() => {
        guards = [];
        for (const guard of beforeResolveGuards.list()) {
          guards.push(guardToPromiseFn(guard, to, from));
        }
        guards.push(canceledNavigationCheck);
        return runGuardQueue(guards);
      }).catch((err) => isNavigationFailure(err, 8) ? err : Promise.reject(err));
    }
    function triggerAfterEach(to, from, failure) {
      for (const guard of afterGuards.list())
        guard(to, from, failure);
    }
    function finalizeNavigation(toLocation, from, isPush, replace2, data) {
      const error = checkCanceledNavigation(toLocation, from);
      if (error)
        return error;
      const isFirstNavigation = from === START_LOCATION_NORMALIZED;
      const state = {};
      if (isPush) {
        if (replace2 || isFirstNavigation)
          routerHistory.replace(toLocation.fullPath, assign({
            scroll: isFirstNavigation && state && state.scroll
          }, data));
        else
          routerHistory.push(toLocation.fullPath, data);
      }
      currentRoute.value = toLocation;
      handleScroll();
      markAsReady();
    }
    let removeHistoryListener;
    function setupListeners() {
      if (removeHistoryListener)
        return;
      removeHistoryListener = routerHistory.listen((to, _from, info) => {
        const toLocation = resolve(to);
        const shouldRedirect = handleRedirectRecord(toLocation);
        if (shouldRedirect) {
          pushWithRedirect(assign(shouldRedirect, { replace: true }), toLocation).catch(noop);
          return;
        }
        pendingLocation = toLocation;
        const from = currentRoute.value;
        navigate(toLocation, from).catch((error) => {
          if (isNavigationFailure(error, 4 | 8)) {
            return error;
          }
          if (isNavigationFailure(error, 2)) {
            pushWithRedirect(error.to, toLocation).then((failure) => {
              if (isNavigationFailure(failure, 4 | 16) && !info.delta && info.type === NavigationType.pop) {
                routerHistory.go(-1, false);
              }
            }).catch(noop);
            return Promise.reject();
          }
          if (info.delta)
            routerHistory.go(-info.delta, false);
          return triggerError(error, toLocation, from);
        }).then((failure) => {
          failure = failure || finalizeNavigation(toLocation, from, false);
          if (failure) {
            if (info.delta) {
              routerHistory.go(-info.delta, false);
            } else if (info.type === NavigationType.pop && isNavigationFailure(failure, 4 | 16)) {
              routerHistory.go(-1, false);
            }
          }
          triggerAfterEach(toLocation, from, failure);
        }).catch(noop);
      });
    }
    let readyHandlers = useCallbacks();
    let errorHandlers = useCallbacks();
    let ready;
    function triggerError(error, to, from) {
      markAsReady(error);
      const list = errorHandlers.list();
      if (list.length) {
        list.forEach((handler) => handler(error, to, from));
      } else {
        console.error(error);
      }
      return Promise.reject(error);
    }
    function isReady() {
      if (ready && currentRoute.value !== START_LOCATION_NORMALIZED)
        return Promise.resolve();
      return new Promise((resolve2, reject) => {
        readyHandlers.add([resolve2, reject]);
      });
    }
    function markAsReady(err) {
      if (!ready) {
        ready = !err;
        setupListeners();
        readyHandlers.list().forEach(([resolve2, reject]) => err ? reject(err) : resolve2());
        readyHandlers.reset();
      }
      return err;
    }
    function handleScroll(to, from, isPush, isFirstNavigation) {
      return Promise.resolve();
    }
    const go = (delta) => routerHistory.go(delta);
    const installedApps = /* @__PURE__ */ new Set();
    const router = {
      currentRoute,
      addRoute,
      removeRoute,
      hasRoute,
      getRoutes,
      resolve,
      options,
      push,
      replace,
      go,
      back: () => go(-1),
      forward: () => go(1),
      beforeEach: beforeGuards.add,
      beforeResolve: beforeResolveGuards.add,
      afterEach: afterGuards.add,
      onError: errorHandlers.add,
      isReady,
      install(app) {
        const router2 = this;
        app.component("RouterLink", RouterLink);
        app.component("RouterView", RouterView);
        app.config.globalProperties.$router = router2;
        Object.defineProperty(app.config.globalProperties, "$route", {
          enumerable: true,
          get: () => vue.unref(currentRoute)
        });
        const reactiveRoute = {};
        for (const key in START_LOCATION_NORMALIZED) {
          reactiveRoute[key] = vue.computed(() => currentRoute.value[key]);
        }
        app.provide(routerKey, router2);
        app.provide(routeLocationKey, vue.reactive(reactiveRoute));
        app.provide(routerViewLocationKey, currentRoute);
        const unmountApp = app.unmount;
        installedApps.add(app);
        app.unmount = function() {
          installedApps.delete(app);
          if (installedApps.size < 1) {
            pendingLocation = START_LOCATION_NORMALIZED;
            removeHistoryListener && removeHistoryListener();
            removeHistoryListener = null;
            currentRoute.value = START_LOCATION_NORMALIZED;
            ready = false;
          }
          unmountApp();
        };
      }
    };
    return router;
  }
  function runGuardQueue(guards) {
    return guards.reduce((promise, guard) => promise.then(() => guard()), Promise.resolve());
  }
  function extractChangingRecords(to, from) {
    const leavingRecords = [];
    const updatingRecords = [];
    const enteringRecords = [];
    const len = Math.max(from.matched.length, to.matched.length);
    for (let i2 = 0; i2 < len; i2++) {
      const recordFrom = from.matched[i2];
      if (recordFrom) {
        if (to.matched.find((record) => isSameRouteRecord(record, recordFrom)))
          updatingRecords.push(recordFrom);
        else
          leavingRecords.push(recordFrom);
      }
      const recordTo = to.matched[i2];
      if (recordTo) {
        if (!from.matched.find((record) => isSameRouteRecord(record, recordTo))) {
          enteringRecords.push(recordTo);
        }
      }
    }
    return [leavingRecords, updatingRecords, enteringRecords];
  }
  function useRouter2() {
    return vue.inject(routerKey);
  }
  function useRoute() {
    return vue.inject(routeLocationKey);
  }
  exports.RouterLink = RouterLink;
  exports.RouterView = RouterView;
  exports.START_LOCATION = START_LOCATION_NORMALIZED;
  exports.createMemoryHistory = createMemoryHistory;
  exports.createRouter = createRouter;
  exports.createRouterMatcher = createRouterMatcher;
  exports.createWebHashHistory = createWebHashHistory;
  exports.createWebHistory = createWebHistory;
  exports.isNavigationFailure = isNavigationFailure;
  exports.matchedRouteKey = matchedRouteKey;
  exports.onBeforeRouteLeave = onBeforeRouteLeave;
  exports.onBeforeRouteUpdate = onBeforeRouteUpdate;
  exports.parseQuery = parseQuery;
  exports.routeLocationKey = routeLocationKey;
  exports.routerKey = routerKey;
  exports.routerViewLocationKey = routerViewLocationKey;
  exports.stringifyQuery = stringifyQuery;
  exports.useLink = useLink;
  exports.useRoute = useRoute;
  exports.useRouter = useRouter2;
  exports.viewDepthKey = viewDepthKey;
})(vueRouter_cjs_prod);
const wrapInRef = (value) => vue_cjs_prod.isRef(value) ? value : vue_cjs_prod.ref(value);
const getDefault = () => null;
function useAsyncData(key, handler, options) {
  var _a2, _b2, _c, _d, _e;
  if (typeof key !== "string") {
    throw new TypeError("asyncData key must be a string");
  }
  if (typeof handler !== "function") {
    throw new TypeError("asyncData handler must be a function");
  }
  options = __spreadValues({ server: true, default: getDefault }, options);
  if (options.defer) {
    console.warn("[useAsyncData] `defer` has been renamed to `lazy`. Support for `defer` will be removed in RC.");
  }
  options.lazy = (_b2 = (_a2 = options.lazy) != null ? _a2 : options.defer) != null ? _b2 : false;
  options.initialCache = (_c = options.initialCache) != null ? _c : true;
  const nuxt = useNuxtApp();
  const instance = vue_cjs_prod.getCurrentInstance();
  if (instance && !instance._nuxtOnBeforeMountCbs) {
    const cbs = instance._nuxtOnBeforeMountCbs = [];
    if (instance && false) {
      vue_cjs_prod.onBeforeMount(() => {
        cbs.forEach((cb) => {
          cb();
        });
        cbs.splice(0, cbs.length);
      });
      vue_cjs_prod.onUnmounted(() => cbs.splice(0, cbs.length));
    }
  }
  const useInitialCache = () => options.initialCache && nuxt.payload.data[key] !== void 0;
  const asyncData = {
    data: wrapInRef((_d = nuxt.payload.data[key]) != null ? _d : options.default()),
    pending: vue_cjs_prod.ref(!useInitialCache()),
    error: vue_cjs_prod.ref((_e = nuxt.payload._errors[key]) != null ? _e : null)
  };
  asyncData.refresh = (opts = {}) => {
    if (nuxt._asyncDataPromises[key]) {
      return nuxt._asyncDataPromises[key];
    }
    if (opts._initial && useInitialCache()) {
      return nuxt.payload.data[key];
    }
    asyncData.pending.value = true;
    nuxt._asyncDataPromises[key] = Promise.resolve(handler(nuxt)).then((result) => {
      if (options.transform) {
        result = options.transform(result);
      }
      if (options.pick) {
        result = pick(result, options.pick);
      }
      asyncData.data.value = result;
      asyncData.error.value = null;
    }).catch((error) => {
      asyncData.error.value = error;
      asyncData.data.value = vue_cjs_prod.unref(options.default());
    }).finally(() => {
      asyncData.pending.value = false;
      nuxt.payload.data[key] = asyncData.data.value;
      if (asyncData.error.value) {
        nuxt.payload._errors[key] = true;
      }
      delete nuxt._asyncDataPromises[key];
    });
    return nuxt._asyncDataPromises[key];
  };
  const initialFetch = () => asyncData.refresh({ _initial: true });
  const fetchOnServer = options.server !== false && nuxt.payload.serverRendered;
  if (fetchOnServer) {
    const promise = initialFetch();
    vue_cjs_prod.onServerPrefetch(() => promise);
  }
  const asyncDataPromise = Promise.resolve(nuxt._asyncDataPromises[key]).then(() => asyncData);
  Object.assign(asyncDataPromise, asyncData);
  return asyncDataPromise;
}
function pick(obj, keys) {
  const newObj = {};
  for (const key of keys) {
    newObj[key] = obj[key];
  }
  return newObj;
}
const useState = (key, init) => {
  const nuxt = useNuxtApp();
  const state = vue_cjs_prod.toRef(nuxt.payload.state, key);
  if (state.value === void 0 && init) {
    const initialValue = init();
    if (vue_cjs_prod.isRef(initialValue)) {
      nuxt.payload.state[key] = initialValue;
      return initialValue;
    }
    state.value = initialValue;
  }
  return state;
};
const useError = () => {
  const nuxtApp = useNuxtApp();
  return useState("error", () => nuxtApp.ssrContext.error);
};
const throwError = (_err) => {
  const nuxtApp = useNuxtApp();
  useError();
  const err = typeof _err === "string" ? new Error(_err) : _err;
  nuxtApp.callHook("app:error", err);
  {
    nuxtApp.ssrContext.error = nuxtApp.ssrContext.error || err;
  }
  return err;
};
function murmurHash(key, seed = 0) {
  if (typeof key === "string") {
    key = createBuffer(key);
  }
  let i2 = 0;
  let h1 = seed;
  let k1;
  let h1b;
  const remainder = key.length & 3;
  const bytes = key.length - remainder;
  const c1 = 3432918353;
  const c2 = 461845907;
  while (i2 < bytes) {
    k1 = key[i2] & 255 | (key[++i2] & 255) << 8 | (key[++i2] & 255) << 16 | (key[++i2] & 255) << 24;
    ++i2;
    k1 = (k1 & 65535) * c1 + (((k1 >>> 16) * c1 & 65535) << 16) & 4294967295;
    k1 = k1 << 15 | k1 >>> 17;
    k1 = (k1 & 65535) * c2 + (((k1 >>> 16) * c2 & 65535) << 16) & 4294967295;
    h1 ^= k1;
    h1 = h1 << 13 | h1 >>> 19;
    h1b = (h1 & 65535) * 5 + (((h1 >>> 16) * 5 & 65535) << 16) & 4294967295;
    h1 = (h1b & 65535) + 27492 + (((h1b >>> 16) + 58964 & 65535) << 16);
  }
  k1 = 0;
  switch (remainder) {
    case 3:
      k1 ^= (key[i2 + 2] & 255) << 16;
      break;
    case 2:
      k1 ^= (key[i2 + 1] & 255) << 8;
      break;
    case 1:
      k1 ^= key[i2] & 255;
      k1 = (k1 & 65535) * c1 + (((k1 >>> 16) * c1 & 65535) << 16) & 4294967295;
      k1 = k1 << 15 | k1 >>> 17;
      k1 = (k1 & 65535) * c2 + (((k1 >>> 16) * c2 & 65535) << 16) & 4294967295;
      h1 ^= k1;
  }
  h1 ^= key.length;
  h1 ^= h1 >>> 16;
  h1 = (h1 & 65535) * 2246822507 + (((h1 >>> 16) * 2246822507 & 65535) << 16) & 4294967295;
  h1 ^= h1 >>> 13;
  h1 = (h1 & 65535) * 3266489909 + (((h1 >>> 16) * 3266489909 & 65535) << 16) & 4294967295;
  h1 ^= h1 >>> 16;
  return h1 >>> 0;
}
function createBuffer(val) {
  return new TextEncoder().encode(val);
}
const defaults = {
  ignoreUnknown: false,
  respectType: false,
  respectFunctionNames: false,
  respectFunctionProperties: false,
  unorderedObjects: true,
  unorderedArrays: false,
  unorderedSets: false
};
function objectHash(object, options = {}) {
  options = __spreadValues(__spreadValues({}, defaults), options);
  const hasher = createHasher(options);
  hasher.dispatch(object);
  return hasher.toString();
}
function createHasher(options) {
  const buff = [];
  let context = [];
  const write = (str) => {
    buff.push(str);
  };
  return {
    toString() {
      return buff.join("");
    },
    getContext() {
      return context;
    },
    dispatch(value) {
      if (options.replacer) {
        value = options.replacer(value);
      }
      const type = value === null ? "null" : typeof value;
      return this["_" + type](value);
    },
    _object(object) {
      const pattern = /\[object (.*)\]/i;
      const objString = Object.prototype.toString.call(object);
      const _objType = pattern.exec(objString);
      const objType = _objType ? _objType[1].toLowerCase() : "unknown:[" + objString.toLowerCase() + "]";
      let objectNumber = null;
      if ((objectNumber = context.indexOf(object)) >= 0) {
        return this.dispatch("[CIRCULAR:" + objectNumber + "]");
      } else {
        context.push(object);
      }
      if (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(object)) {
        write("buffer:");
        return write(object.toString("utf8"));
      }
      if (objType !== "object" && objType !== "function" && objType !== "asyncfunction") {
        if (this["_" + objType]) {
          this["_" + objType](object);
        } else if (options.ignoreUnknown) {
          return write("[" + objType + "]");
        } else {
          throw new Error('Unknown object type "' + objType + '"');
        }
      } else {
        let keys = Object.keys(object);
        if (options.unorderedObjects) {
          keys = keys.sort();
        }
        if (options.respectType !== false && !isNativeFunction(object)) {
          keys.splice(0, 0, "prototype", "__proto__", "letructor");
        }
        if (options.excludeKeys) {
          keys = keys.filter(function(key) {
            return !options.excludeKeys(key);
          });
        }
        write("object:" + keys.length + ":");
        return keys.forEach((key) => {
          this.dispatch(key);
          write(":");
          if (!options.excludeValues) {
            this.dispatch(object[key]);
          }
          write(",");
        });
      }
    },
    _array(arr, unordered) {
      unordered = typeof unordered !== "undefined" ? unordered : options.unorderedArrays !== false;
      write("array:" + arr.length + ":");
      if (!unordered || arr.length <= 1) {
        return arr.forEach((entry2) => {
          return this.dispatch(entry2);
        });
      }
      const contextAdditions = [];
      const entries = arr.map((entry2) => {
        const hasher = createHasher(options);
        hasher.dispatch(entry2);
        contextAdditions.push(hasher.getContext());
        return hasher.toString();
      });
      context = context.concat(contextAdditions);
      entries.sort();
      return this._array(entries, false);
    },
    _date(date) {
      return write("date:" + date.toJSON());
    },
    _symbol(sym) {
      return write("symbol:" + sym.toString());
    },
    _error(err) {
      return write("error:" + err.toString());
    },
    _boolean(bool) {
      return write("bool:" + bool.toString());
    },
    _string(string) {
      write("string:" + string.length + ":");
      write(string.toString());
    },
    _function(fn) {
      write("fn:");
      if (isNativeFunction(fn)) {
        this.dispatch("[native]");
      } else {
        this.dispatch(fn.toString());
      }
      if (options.respectFunctionNames !== false) {
        this.dispatch("function-name:" + String(fn.name));
      }
      if (options.respectFunctionProperties) {
        this._object(fn);
      }
    },
    _number(number) {
      return write("number:" + number.toString());
    },
    _xml(xml) {
      return write("xml:" + xml.toString());
    },
    _null() {
      return write("Null");
    },
    _undefined() {
      return write("Undefined");
    },
    _regexp(regex) {
      return write("regex:" + regex.toString());
    },
    _uint8array(arr) {
      write("uint8array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    _uint8clampedarray(arr) {
      write("uint8clampedarray:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    _int8array(arr) {
      write("int8array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    _uint16array(arr) {
      write("uint16array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    _int16array(arr) {
      write("int16array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    _uint32array(arr) {
      write("uint32array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    _int32array(arr) {
      write("int32array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    _float32array(arr) {
      write("float32array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    _float64array(arr) {
      write("float64array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    _arraybuffer(arr) {
      write("arraybuffer:");
      return this.dispatch(new Uint8Array(arr));
    },
    _url(url) {
      return write("url:" + url.toString());
    },
    _map(map) {
      write("map:");
      const arr = Array.from(map);
      return this._array(arr, options.unorderedSets !== false);
    },
    _set(set) {
      write("set:");
      const arr = Array.from(set);
      return this._array(arr, options.unorderedSets !== false);
    },
    _file(file) {
      write("file:");
      return this.dispatch([file.name, file.size, file.type, file.lastModfied]);
    },
    _blob() {
      if (options.ignoreUnknown) {
        return write("[blob]");
      }
      throw new Error('Hashing Blob objects is currently not supported\nUse "options.replacer" or "options.ignoreUnknown"\n');
    },
    _domwindow() {
      return write("domwindow");
    },
    _bigint(number) {
      return write("bigint:" + number.toString());
    },
    _process() {
      return write("process");
    },
    _timer() {
      return write("timer");
    },
    _pipe() {
      return write("pipe");
    },
    _tcp() {
      return write("tcp");
    },
    _udp() {
      return write("udp");
    },
    _tty() {
      return write("tty");
    },
    _statwatcher() {
      return write("statwatcher");
    },
    _securecontext() {
      return write("securecontext");
    },
    _connection() {
      return write("connection");
    },
    _zlib() {
      return write("zlib");
    },
    _context() {
      return write("context");
    },
    _nodescript() {
      return write("nodescript");
    },
    _httpparser() {
      return write("httpparser");
    },
    _dataview() {
      return write("dataview");
    },
    _signal() {
      return write("signal");
    },
    _fsevent() {
      return write("fsevent");
    },
    _tlswrap() {
      return write("tlswrap");
    }
  };
}
function isNativeFunction(f2) {
  if (typeof f2 !== "function") {
    return false;
  }
  const exp = /^function\s+\w*\s*\(\s*\)\s*{\s+\[native code\]\s+}$/i;
  return exp.exec(Function.prototype.toString.call(f2)) != null;
}
function hash(object, options = {}) {
  const hashed = typeof object === "string" ? object : objectHash(object, options);
  return String(murmurHash(hashed));
}
function useFetch(request, opts = {}) {
  const key = "$f_" + (opts.key || hash([request, __spreadProps(__spreadValues({}, opts), { transform: null })]));
  const _request = vue_cjs_prod.computed(() => {
    let r2 = request;
    if (typeof r2 === "function") {
      r2 = r2();
    }
    return vue_cjs_prod.isRef(r2) ? r2.value : r2;
  });
  const _fetchOptions = __spreadProps(__spreadValues({}, opts), {
    cache: typeof opts.cache === "boolean" ? void 0 : opts.cache
  });
  const _asyncDataOptions = __spreadProps(__spreadValues({}, opts), {
    watch: [
      _request,
      ...opts.watch || []
    ]
  });
  const asyncData = useAsyncData(key, () => {
    return $fetch(_request.value, _fetchOptions);
  }, _asyncDataOptions);
  return asyncData;
}
const decode = decodeURIComponent;
const encode = encodeURIComponent;
const pairSplitRegExp = /; */;
const fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
function parse(str, options) {
  if (typeof str !== "string") {
    throw new TypeError("argument str must be a string");
  }
  let obj = {};
  let opt = options || {};
  let pairs = str.split(pairSplitRegExp);
  let dec = opt.decode || decode;
  for (let i2 = 0; i2 < pairs.length; i2++) {
    let pair = pairs[i2];
    let eq_idx = pair.indexOf("=");
    if (eq_idx < 0) {
      continue;
    }
    let key = pair.substr(0, eq_idx).trim();
    let val = pair.substr(++eq_idx, pair.length).trim();
    if (val[0] == '"') {
      val = val.slice(1, -1);
    }
    if (obj[key] == void 0) {
      obj[key] = tryDecode(val, dec);
    }
  }
  return obj;
}
function serialize(name, value, options) {
  let opt = options || {};
  let enc = opt.encode || encode;
  if (typeof enc !== "function") {
    throw new TypeError("option encode is invalid");
  }
  if (!fieldContentRegExp.test(name)) {
    throw new TypeError("argument name is invalid");
  }
  let encodedValue = enc(value);
  if (encodedValue && !fieldContentRegExp.test(encodedValue)) {
    throw new TypeError("argument val is invalid");
  }
  let str = name + "=" + encodedValue;
  if (opt.maxAge != null) {
    let maxAge = opt.maxAge - 0;
    if (isNaN(maxAge) || !isFinite(maxAge)) {
      throw new TypeError("option maxAge is invalid");
    }
    str += "; Max-Age=" + Math.floor(maxAge);
  }
  if (opt.domain) {
    if (!fieldContentRegExp.test(opt.domain)) {
      throw new TypeError("option domain is invalid");
    }
    str += "; Domain=" + opt.domain;
  }
  if (opt.path) {
    if (!fieldContentRegExp.test(opt.path)) {
      throw new TypeError("option path is invalid");
    }
    str += "; Path=" + opt.path;
  }
  if (opt.expires) {
    if (typeof opt.expires.toUTCString !== "function") {
      throw new TypeError("option expires is invalid");
    }
    str += "; Expires=" + opt.expires.toUTCString();
  }
  if (opt.httpOnly) {
    str += "; HttpOnly";
  }
  if (opt.secure) {
    str += "; Secure";
  }
  if (opt.sameSite) {
    let sameSite = typeof opt.sameSite === "string" ? opt.sameSite.toLowerCase() : opt.sameSite;
    switch (sameSite) {
      case true:
        str += "; SameSite=Strict";
        break;
      case "lax":
        str += "; SameSite=Lax";
        break;
      case "strict":
        str += "; SameSite=Strict";
        break;
      case "none":
        str += "; SameSite=None";
        break;
      default:
        throw new TypeError("option sameSite is invalid");
    }
  }
  return str;
}
function tryDecode(str, decode2) {
  try {
    return decode2(str);
  } catch (e2) {
    return str;
  }
}
const MIMES = {
  html: "text/html",
  json: "application/json"
};
const defer = typeof setImmediate !== "undefined" ? setImmediate : (fn) => fn();
function send(event, data, type) {
  if (type) {
    defaultContentType(event, type);
  }
  return new Promise((resolve) => {
    defer(() => {
      event.res.end(data);
      resolve(void 0);
    });
  });
}
function defaultContentType(event, type) {
  if (type && !event.res.getHeader("Content-Type")) {
    event.res.setHeader("Content-Type", type);
  }
}
function sendRedirect(event, location2, code = 302) {
  event.res.statusCode = code;
  event.res.setHeader("Location", location2);
  return send(event, "Redirecting to " + location2, MIMES.html);
}
function appendHeader(event, name, value) {
  let current = event.res.getHeader(name);
  if (!current) {
    event.res.setHeader(name, value);
    return;
  }
  if (!Array.isArray(current)) {
    current = [current.toString()];
  }
  event.res.setHeader(name, current.concat(value));
}
class H3Error extends Error {
  constructor() {
    super(...arguments);
    this.statusCode = 500;
    this.statusMessage = "H3Error";
  }
}
function createError(input) {
  var _a2;
  if (input instanceof H3Error) {
    return input;
  }
  const err = new H3Error((_a2 = input.message) != null ? _a2 : input.statusMessage);
  if (input.statusCode) {
    err.statusCode = input.statusCode;
  }
  if (input.statusMessage) {
    err.statusMessage = input.statusMessage;
  }
  if (input.data) {
    err.data = input.data;
  }
  return err;
}
function useRequestEvent(nuxtApp = useNuxtApp()) {
  var _a2;
  return (_a2 = nuxtApp.ssrContext) == null ? void 0 : _a2.event;
}
const CookieDefaults = {
  path: "/",
  decode: (val) => destr(decodeURIComponent(val)),
  encode: (val) => encodeURIComponent(typeof val === "string" ? val : JSON.stringify(val))
};
function useCookie(name, _opts) {
  var _a2, _b2;
  const opts = __spreadValues(__spreadValues({}, CookieDefaults), _opts);
  const cookies = readRawCookies(opts);
  const cookie = wrapInRef((_b2 = cookies[name]) != null ? _b2 : (_a2 = opts.default) == null ? void 0 : _a2.call(opts));
  {
    const nuxtApp = useNuxtApp();
    const writeFinalCookieValue = () => {
      if (cookie.value !== cookies[name]) {
        writeServerCookie(useRequestEvent(nuxtApp), name, cookie.value, opts);
      }
    };
    nuxtApp.hooks.hookOnce("app:rendered", writeFinalCookieValue);
    nuxtApp.hooks.hookOnce("app:redirected", writeFinalCookieValue);
  }
  return cookie;
}
function readRawCookies(opts) {
  var _a2;
  {
    return parse(((_a2 = useRequestEvent()) == null ? void 0 : _a2.req.headers.cookie) || "", opts);
  }
}
function serializeCookie(name, value, opts = {}) {
  if (value === null || value === void 0) {
    return serialize(name, value, __spreadProps(__spreadValues({}, opts), { maxAge: -1 }));
  }
  return serialize(name, value, opts);
}
function writeServerCookie(event, name, value, opts) {
  if (event) {
    appendHeader(event, "Set-Cookie", serializeCookie(name, value, opts));
  }
}
const useRouter = () => {
  var _a2;
  return (_a2 = useNuxtApp()) == null ? void 0 : _a2.$router;
};
const isProcessingMiddleware = () => {
  try {
    if (useNuxtApp()._processingMiddleware) {
      return true;
    }
  } catch {
    return true;
  }
  return false;
};
const navigateTo = (to, options = {}) => {
  if (!to) {
    to = "/";
  }
  if (isProcessingMiddleware()) {
    return to;
  }
  const router = useRouter();
  {
    const nuxtApp = useNuxtApp();
    if (nuxtApp.ssrContext && nuxtApp.ssrContext.event) {
      const redirectLocation = router.resolve(to).fullPath || "/";
      return nuxtApp.callHook("app:redirected").then(() => sendRedirect(nuxtApp.ssrContext.event, redirectLocation, options.redirectCode || 301));
    }
  }
  return options.replace ? router.replace(to) : router.push(to);
};
const firstNonUndefined = (...args) => args.find((arg) => arg !== void 0);
const DEFAULT_EXTERNAL_REL_ATTRIBUTE = "noopener noreferrer";
function defineNuxtLink(options) {
  const componentName = options.componentName || "NuxtLink";
  const checkPropConflicts = (props, main, sub) => {
  };
  return vue_cjs_prod.defineComponent({
    name: componentName,
    props: {
      to: {
        type: [String, Object],
        default: void 0,
        required: false
      },
      href: {
        type: [String, Object],
        default: void 0,
        required: false
      },
      target: {
        type: String,
        default: void 0,
        required: false
      },
      rel: {
        type: String,
        default: void 0,
        required: false
      },
      noRel: {
        type: Boolean,
        default: void 0,
        required: false
      },
      activeClass: {
        type: String,
        default: void 0,
        required: false
      },
      exactActiveClass: {
        type: String,
        default: void 0,
        required: false
      },
      replace: {
        type: Boolean,
        default: void 0,
        required: false
      },
      ariaCurrentValue: {
        type: String,
        default: void 0,
        required: false
      },
      external: {
        type: Boolean,
        default: void 0,
        required: false
      },
      custom: {
        type: Boolean,
        default: void 0,
        required: false
      }
    },
    setup(props, { slots }) {
      const router = useRouter();
      const to = vue_cjs_prod.computed(() => {
        checkPropConflicts();
        return props.to || props.href || "";
      });
      const isExternal = vue_cjs_prod.computed(() => {
        if (props.external) {
          return true;
        }
        if (props.target && props.target !== "_self") {
          return true;
        }
        if (typeof to.value === "object") {
          return false;
        }
        return to.value === "" || hasProtocol(to.value, true);
      });
      return () => {
        var _a2, _b2, _c;
        if (!isExternal.value) {
          return vue_cjs_prod.h(vue_cjs_prod.resolveComponent("RouterLink"), {
            to: to.value,
            activeClass: props.activeClass || options.activeClass,
            exactActiveClass: props.exactActiveClass || options.exactActiveClass,
            replace: props.replace,
            ariaCurrentValue: props.ariaCurrentValue
          }, slots.default);
        }
        const href = typeof to.value === "object" ? (_b2 = (_a2 = router.resolve(to.value)) == null ? void 0 : _a2.href) != null ? _b2 : null : to.value || null;
        const target = props.target || null;
        checkPropConflicts();
        const rel = props.noRel ? null : firstNonUndefined(props.rel, options.externalRelAttribute, href ? DEFAULT_EXTERNAL_REL_ATTRIBUTE : "") || null;
        return vue_cjs_prod.h("a", { href, rel, target }, (_c = slots.default) == null ? void 0 : _c.call(slots));
      };
    }
  });
}
const __nuxt_component_0$2 = defineNuxtLink({ componentName: "NuxtLink" });
var shared_cjs_prod = {};
Object.defineProperty(shared_cjs_prod, "__esModule", { value: true });
function makeMap(str, expectsLowerCase) {
  const map = /* @__PURE__ */ Object.create(null);
  const list = str.split(",");
  for (let i2 = 0; i2 < list.length; i2++) {
    map[list[i2]] = true;
  }
  return expectsLowerCase ? (val) => !!map[val.toLowerCase()] : (val) => !!map[val];
}
const PatchFlagNames = {
  [1]: `TEXT`,
  [2]: `CLASS`,
  [4]: `STYLE`,
  [8]: `PROPS`,
  [16]: `FULL_PROPS`,
  [32]: `HYDRATE_EVENTS`,
  [64]: `STABLE_FRAGMENT`,
  [128]: `KEYED_FRAGMENT`,
  [256]: `UNKEYED_FRAGMENT`,
  [512]: `NEED_PATCH`,
  [1024]: `DYNAMIC_SLOTS`,
  [2048]: `DEV_ROOT_FRAGMENT`,
  [-1]: `HOISTED`,
  [-2]: `BAIL`
};
const slotFlagsText = {
  [1]: "STABLE",
  [2]: "DYNAMIC",
  [3]: "FORWARDED"
};
const GLOBALS_WHITE_LISTED = "Infinity,undefined,NaN,isFinite,isNaN,parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,BigInt";
const isGloballyWhitelisted = /* @__PURE__ */ makeMap(GLOBALS_WHITE_LISTED);
const range = 2;
function generateCodeFrame(source, start = 0, end = source.length) {
  let lines = source.split(/(\r?\n)/);
  const newlineSequences = lines.filter((_2, idx) => idx % 2 === 1);
  lines = lines.filter((_2, idx) => idx % 2 === 0);
  let count = 0;
  const res = [];
  for (let i2 = 0; i2 < lines.length; i2++) {
    count += lines[i2].length + (newlineSequences[i2] && newlineSequences[i2].length || 0);
    if (count >= start) {
      for (let j = i2 - range; j <= i2 + range || end > count; j++) {
        if (j < 0 || j >= lines.length)
          continue;
        const line = j + 1;
        res.push(`${line}${" ".repeat(Math.max(3 - String(line).length, 0))}|  ${lines[j]}`);
        const lineLength = lines[j].length;
        const newLineSeqLength = newlineSequences[j] && newlineSequences[j].length || 0;
        if (j === i2) {
          const pad = start - (count - (lineLength + newLineSeqLength));
          const length = Math.max(1, end > count ? lineLength - pad : end - start);
          res.push(`   |  ` + " ".repeat(pad) + "^".repeat(length));
        } else if (j > i2) {
          if (end > count) {
            const length = Math.max(Math.min(end - count, lineLength), 1);
            res.push(`   |  ` + "^".repeat(length));
          }
          count += lineLength + newLineSeqLength;
        }
      }
      break;
    }
  }
  return res.join("\n");
}
const specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`;
const isSpecialBooleanAttr = /* @__PURE__ */ makeMap(specialBooleanAttrs);
const isBooleanAttr = /* @__PURE__ */ makeMap(specialBooleanAttrs + `,async,autofocus,autoplay,controls,default,defer,disabled,hidden,loop,open,required,reversed,scoped,seamless,checked,muted,multiple,selected`);
function includeBooleanAttr(value) {
  return !!value || value === "";
}
const unsafeAttrCharRE = /[>/="'\u0009\u000a\u000c\u0020]/;
const attrValidationCache = {};
function isSSRSafeAttrName(name) {
  if (attrValidationCache.hasOwnProperty(name)) {
    return attrValidationCache[name];
  }
  const isUnsafe = unsafeAttrCharRE.test(name);
  if (isUnsafe) {
    console.error(`unsafe attribute name: ${name}`);
  }
  return attrValidationCache[name] = !isUnsafe;
}
const propsToAttrMap = {
  acceptCharset: "accept-charset",
  className: "class",
  htmlFor: "for",
  httpEquiv: "http-equiv"
};
const isNoUnitNumericStyleProp = /* @__PURE__ */ makeMap(`animation-iteration-count,border-image-outset,border-image-slice,border-image-width,box-flex,box-flex-group,box-ordinal-group,column-count,columns,flex,flex-grow,flex-positive,flex-shrink,flex-negative,flex-order,grid-row,grid-row-end,grid-row-span,grid-row-start,grid-column,grid-column-end,grid-column-span,grid-column-start,font-weight,line-clamp,line-height,opacity,order,orphans,tab-size,widows,z-index,zoom,fill-opacity,flood-opacity,stop-opacity,stroke-dasharray,stroke-dashoffset,stroke-miterlimit,stroke-opacity,stroke-width`);
const isKnownHtmlAttr = /* @__PURE__ */ makeMap(`accept,accept-charset,accesskey,action,align,allow,alt,async,autocapitalize,autocomplete,autofocus,autoplay,background,bgcolor,border,buffered,capture,challenge,charset,checked,cite,class,code,codebase,color,cols,colspan,content,contenteditable,contextmenu,controls,coords,crossorigin,csp,data,datetime,decoding,default,defer,dir,dirname,disabled,download,draggable,dropzone,enctype,enterkeyhint,for,form,formaction,formenctype,formmethod,formnovalidate,formtarget,headers,height,hidden,high,href,hreflang,http-equiv,icon,id,importance,integrity,ismap,itemprop,keytype,kind,label,lang,language,loading,list,loop,low,manifest,max,maxlength,minlength,media,min,multiple,muted,name,novalidate,open,optimum,pattern,ping,placeholder,poster,preload,radiogroup,readonly,referrerpolicy,rel,required,reversed,rows,rowspan,sandbox,scope,scoped,selected,shape,size,sizes,slot,span,spellcheck,src,srcdoc,srclang,srcset,start,step,style,summary,tabindex,target,title,translate,type,usemap,value,width,wrap`);
const isKnownSvgAttr = /* @__PURE__ */ makeMap(`xmlns,accent-height,accumulate,additive,alignment-baseline,alphabetic,amplitude,arabic-form,ascent,attributeName,attributeType,azimuth,baseFrequency,baseline-shift,baseProfile,bbox,begin,bias,by,calcMode,cap-height,class,clip,clipPathUnits,clip-path,clip-rule,color,color-interpolation,color-interpolation-filters,color-profile,color-rendering,contentScriptType,contentStyleType,crossorigin,cursor,cx,cy,d,decelerate,descent,diffuseConstant,direction,display,divisor,dominant-baseline,dur,dx,dy,edgeMode,elevation,enable-background,end,exponent,fill,fill-opacity,fill-rule,filter,filterRes,filterUnits,flood-color,flood-opacity,font-family,font-size,font-size-adjust,font-stretch,font-style,font-variant,font-weight,format,from,fr,fx,fy,g1,g2,glyph-name,glyph-orientation-horizontal,glyph-orientation-vertical,glyphRef,gradientTransform,gradientUnits,hanging,height,href,hreflang,horiz-adv-x,horiz-origin-x,id,ideographic,image-rendering,in,in2,intercept,k,k1,k2,k3,k4,kernelMatrix,kernelUnitLength,kerning,keyPoints,keySplines,keyTimes,lang,lengthAdjust,letter-spacing,lighting-color,limitingConeAngle,local,marker-end,marker-mid,marker-start,markerHeight,markerUnits,markerWidth,mask,maskContentUnits,maskUnits,mathematical,max,media,method,min,mode,name,numOctaves,offset,opacity,operator,order,orient,orientation,origin,overflow,overline-position,overline-thickness,panose-1,paint-order,path,pathLength,patternContentUnits,patternTransform,patternUnits,ping,pointer-events,points,pointsAtX,pointsAtY,pointsAtZ,preserveAlpha,preserveAspectRatio,primitiveUnits,r,radius,referrerPolicy,refX,refY,rel,rendering-intent,repeatCount,repeatDur,requiredExtensions,requiredFeatures,restart,result,rotate,rx,ry,scale,seed,shape-rendering,slope,spacing,specularConstant,specularExponent,speed,spreadMethod,startOffset,stdDeviation,stemh,stemv,stitchTiles,stop-color,stop-opacity,strikethrough-position,strikethrough-thickness,string,stroke,stroke-dasharray,stroke-dashoffset,stroke-linecap,stroke-linejoin,stroke-miterlimit,stroke-opacity,stroke-width,style,surfaceScale,systemLanguage,tabindex,tableValues,target,targetX,targetY,text-anchor,text-decoration,text-rendering,textLength,to,transform,transform-origin,type,u1,u2,underline-position,underline-thickness,unicode,unicode-bidi,unicode-range,units-per-em,v-alphabetic,v-hanging,v-ideographic,v-mathematical,values,vector-effect,version,vert-adv-y,vert-origin-x,vert-origin-y,viewBox,viewTarget,visibility,width,widths,word-spacing,writing-mode,x,x-height,x1,x2,xChannelSelector,xlink:actuate,xlink:arcrole,xlink:href,xlink:role,xlink:show,xlink:title,xlink:type,xml:base,xml:lang,xml:space,y,y1,y2,yChannelSelector,z,zoomAndPan`);
function normalizeStyle(value) {
  if (isArray(value)) {
    const res = {};
    for (let i2 = 0; i2 < value.length; i2++) {
      const item = value[i2];
      const normalized = isString(item) ? parseStringStyle(item) : normalizeStyle(item);
      if (normalized) {
        for (const key in normalized) {
          res[key] = normalized[key];
        }
      }
    }
    return res;
  } else if (isString(value)) {
    return value;
  } else if (isObject$1(value)) {
    return value;
  }
}
const listDelimiterRE = /;(?![^(]*\))/g;
const propertyDelimiterRE = /:(.+)/;
function parseStringStyle(cssText) {
  const ret = {};
  cssText.split(listDelimiterRE).forEach((item) => {
    if (item) {
      const tmp = item.split(propertyDelimiterRE);
      tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim());
    }
  });
  return ret;
}
function stringifyStyle(styles) {
  let ret = "";
  if (!styles || isString(styles)) {
    return ret;
  }
  for (const key in styles) {
    const value = styles[key];
    const normalizedKey = key.startsWith(`--`) ? key : hyphenate(key);
    if (isString(value) || typeof value === "number" && isNoUnitNumericStyleProp(normalizedKey)) {
      ret += `${normalizedKey}:${value};`;
    }
  }
  return ret;
}
function normalizeClass(value) {
  let res = "";
  if (isString(value)) {
    res = value;
  } else if (isArray(value)) {
    for (let i2 = 0; i2 < value.length; i2++) {
      const normalized = normalizeClass(value[i2]);
      if (normalized) {
        res += normalized + " ";
      }
    }
  } else if (isObject$1(value)) {
    for (const name in value) {
      if (value[name]) {
        res += name + " ";
      }
    }
  }
  return res.trim();
}
function normalizeProps(props) {
  if (!props)
    return null;
  let { class: klass, style } = props;
  if (klass && !isString(klass)) {
    props.class = normalizeClass(klass);
  }
  if (style) {
    props.style = normalizeStyle(style);
  }
  return props;
}
const HTML_TAGS = "html,body,base,head,link,meta,style,title,address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,nav,section,div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,ruby,s,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,embed,object,param,source,canvas,script,noscript,del,ins,caption,col,colgroup,table,thead,tbody,td,th,tr,button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,output,progress,select,textarea,details,dialog,menu,summary,template,blockquote,iframe,tfoot";
const SVG_TAGS = "svg,animate,animateMotion,animateTransform,circle,clipPath,color-profile,defs,desc,discard,ellipse,feBlend,feColorMatrix,feComponentTransfer,feComposite,feConvolveMatrix,feDiffuseLighting,feDisplacementMap,feDistanceLight,feDropShadow,feFlood,feFuncA,feFuncB,feFuncG,feFuncR,feGaussianBlur,feImage,feMerge,feMergeNode,feMorphology,feOffset,fePointLight,feSpecularLighting,feSpotLight,feTile,feTurbulence,filter,foreignObject,g,hatch,hatchpath,image,line,linearGradient,marker,mask,mesh,meshgradient,meshpatch,meshrow,metadata,mpath,path,pattern,polygon,polyline,radialGradient,rect,set,solidcolor,stop,switch,symbol,text,textPath,title,tspan,unknown,use,view";
const VOID_TAGS = "area,base,br,col,embed,hr,img,input,link,meta,param,source,track,wbr";
const isHTMLTag = /* @__PURE__ */ makeMap(HTML_TAGS);
const isSVGTag = /* @__PURE__ */ makeMap(SVG_TAGS);
const isVoidTag = /* @__PURE__ */ makeMap(VOID_TAGS);
const escapeRE = /["'&<>]/;
function escapeHtml(string) {
  const str = "" + string;
  const match = escapeRE.exec(str);
  if (!match) {
    return str;
  }
  let html = "";
  let escaped;
  let index2;
  let lastIndex = 0;
  for (index2 = match.index; index2 < str.length; index2++) {
    switch (str.charCodeAt(index2)) {
      case 34:
        escaped = "&quot;";
        break;
      case 38:
        escaped = "&amp;";
        break;
      case 39:
        escaped = "&#39;";
        break;
      case 60:
        escaped = "&lt;";
        break;
      case 62:
        escaped = "&gt;";
        break;
      default:
        continue;
    }
    if (lastIndex !== index2) {
      html += str.slice(lastIndex, index2);
    }
    lastIndex = index2 + 1;
    html += escaped;
  }
  return lastIndex !== index2 ? html + str.slice(lastIndex, index2) : html;
}
const commentStripRE = /^-?>|<!--|-->|--!>|<!-$/g;
function escapeHtmlComment(src) {
  return src.replace(commentStripRE, "");
}
function looseCompareArrays(a2, b2) {
  if (a2.length !== b2.length)
    return false;
  let equal = true;
  for (let i2 = 0; equal && i2 < a2.length; i2++) {
    equal = looseEqual(a2[i2], b2[i2]);
  }
  return equal;
}
function looseEqual(a2, b2) {
  if (a2 === b2)
    return true;
  let aValidType = isDate(a2);
  let bValidType = isDate(b2);
  if (aValidType || bValidType) {
    return aValidType && bValidType ? a2.getTime() === b2.getTime() : false;
  }
  aValidType = isArray(a2);
  bValidType = isArray(b2);
  if (aValidType || bValidType) {
    return aValidType && bValidType ? looseCompareArrays(a2, b2) : false;
  }
  aValidType = isObject$1(a2);
  bValidType = isObject$1(b2);
  if (aValidType || bValidType) {
    if (!aValidType || !bValidType) {
      return false;
    }
    const aKeysCount = Object.keys(a2).length;
    const bKeysCount = Object.keys(b2).length;
    if (aKeysCount !== bKeysCount) {
      return false;
    }
    for (const key in a2) {
      const aHasKey = a2.hasOwnProperty(key);
      const bHasKey = b2.hasOwnProperty(key);
      if (aHasKey && !bHasKey || !aHasKey && bHasKey || !looseEqual(a2[key], b2[key])) {
        return false;
      }
    }
  }
  return String(a2) === String(b2);
}
function looseIndexOf(arr, val) {
  return arr.findIndex((item) => looseEqual(item, val));
}
const toDisplayString = (val) => {
  return isString(val) ? val : val == null ? "" : isArray(val) || isObject$1(val) && (val.toString === objectToString || !isFunction(val.toString)) ? JSON.stringify(val, replacer, 2) : String(val);
};
const replacer = (_key, val) => {
  if (val && val.__v_isRef) {
    return replacer(_key, val.value);
  } else if (isMap(val)) {
    return {
      [`Map(${val.size})`]: [...val.entries()].reduce((entries, [key, val2]) => {
        entries[`${key} =>`] = val2;
        return entries;
      }, {})
    };
  } else if (isSet(val)) {
    return {
      [`Set(${val.size})`]: [...val.values()]
    };
  } else if (isObject$1(val) && !isArray(val) && !isPlainObject(val)) {
    return String(val);
  }
  return val;
};
const EMPTY_OBJ = {};
const EMPTY_ARR = [];
const NOOP = () => {
};
const NO = () => false;
const onRE = /^on[^a-z]/;
const isOn = (key) => onRE.test(key);
const isModelListener = (key) => key.startsWith("onUpdate:");
const extend = Object.assign;
const remove = (arr, el) => {
  const i2 = arr.indexOf(el);
  if (i2 > -1) {
    arr.splice(i2, 1);
  }
};
const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty.call(val, key);
const isArray = Array.isArray;
const isMap = (val) => toTypeString(val) === "[object Map]";
const isSet = (val) => toTypeString(val) === "[object Set]";
const isDate = (val) => val instanceof Date;
const isFunction = (val) => typeof val === "function";
const isString = (val) => typeof val === "string";
const isSymbol = (val) => typeof val === "symbol";
const isObject$1 = (val) => val !== null && typeof val === "object";
const isPromise = (val) => {
  return isObject$1(val) && isFunction(val.then) && isFunction(val.catch);
};
const objectToString = Object.prototype.toString;
const toTypeString = (value) => objectToString.call(value);
const toRawType = (value) => {
  return toTypeString(value).slice(8, -1);
};
const isPlainObject = (val) => toTypeString(val) === "[object Object]";
const isIntegerKey = (key) => isString(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
const isReservedProp = /* @__PURE__ */ makeMap(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted");
const isBuiltInDirective = /* @__PURE__ */ makeMap("bind,cloak,else-if,else,for,html,if,model,on,once,pre,show,slot,text,memo");
const cacheStringFunction = (fn) => {
  const cache = /* @__PURE__ */ Object.create(null);
  return (str) => {
    const hit = cache[str];
    return hit || (cache[str] = fn(str));
  };
};
const camelizeRE = /-(\w)/g;
const camelize = cacheStringFunction((str) => {
  return str.replace(camelizeRE, (_2, c2) => c2 ? c2.toUpperCase() : "");
});
const hyphenateRE = /\B([A-Z])/g;
const hyphenate = cacheStringFunction((str) => str.replace(hyphenateRE, "-$1").toLowerCase());
const capitalize = cacheStringFunction((str) => str.charAt(0).toUpperCase() + str.slice(1));
const toHandlerKey = cacheStringFunction((str) => str ? `on${capitalize(str)}` : ``);
const hasChanged = (value, oldValue) => !Object.is(value, oldValue);
const invokeArrayFns = (fns, arg) => {
  for (let i2 = 0; i2 < fns.length; i2++) {
    fns[i2](arg);
  }
};
const def = (obj, key, value) => {
  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    value
  });
};
const toNumber = (val) => {
  const n2 = parseFloat(val);
  return isNaN(n2) ? val : n2;
};
let _globalThis;
const getGlobalThis = () => {
  return _globalThis || (_globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof commonjsGlobal !== "undefined" ? commonjsGlobal : {});
};
shared_cjs_prod.EMPTY_ARR = EMPTY_ARR;
shared_cjs_prod.EMPTY_OBJ = EMPTY_OBJ;
shared_cjs_prod.NO = NO;
shared_cjs_prod.NOOP = NOOP;
shared_cjs_prod.PatchFlagNames = PatchFlagNames;
shared_cjs_prod.camelize = camelize;
shared_cjs_prod.capitalize = capitalize;
shared_cjs_prod.def = def;
shared_cjs_prod.escapeHtml = escapeHtml;
shared_cjs_prod.escapeHtmlComment = escapeHtmlComment;
shared_cjs_prod.extend = extend;
shared_cjs_prod.generateCodeFrame = generateCodeFrame;
shared_cjs_prod.getGlobalThis = getGlobalThis;
shared_cjs_prod.hasChanged = hasChanged;
shared_cjs_prod.hasOwn = hasOwn;
shared_cjs_prod.hyphenate = hyphenate;
shared_cjs_prod.includeBooleanAttr = includeBooleanAttr;
shared_cjs_prod.invokeArrayFns = invokeArrayFns;
shared_cjs_prod.isArray = isArray;
shared_cjs_prod.isBooleanAttr = isBooleanAttr;
shared_cjs_prod.isBuiltInDirective = isBuiltInDirective;
shared_cjs_prod.isDate = isDate;
var isFunction_1 = shared_cjs_prod.isFunction = isFunction;
shared_cjs_prod.isGloballyWhitelisted = isGloballyWhitelisted;
shared_cjs_prod.isHTMLTag = isHTMLTag;
shared_cjs_prod.isIntegerKey = isIntegerKey;
shared_cjs_prod.isKnownHtmlAttr = isKnownHtmlAttr;
shared_cjs_prod.isKnownSvgAttr = isKnownSvgAttr;
shared_cjs_prod.isMap = isMap;
shared_cjs_prod.isModelListener = isModelListener;
shared_cjs_prod.isNoUnitNumericStyleProp = isNoUnitNumericStyleProp;
shared_cjs_prod.isObject = isObject$1;
shared_cjs_prod.isOn = isOn;
shared_cjs_prod.isPlainObject = isPlainObject;
shared_cjs_prod.isPromise = isPromise;
shared_cjs_prod.isReservedProp = isReservedProp;
shared_cjs_prod.isSSRSafeAttrName = isSSRSafeAttrName;
shared_cjs_prod.isSVGTag = isSVGTag;
shared_cjs_prod.isSet = isSet;
shared_cjs_prod.isSpecialBooleanAttr = isSpecialBooleanAttr;
shared_cjs_prod.isString = isString;
shared_cjs_prod.isSymbol = isSymbol;
shared_cjs_prod.isVoidTag = isVoidTag;
shared_cjs_prod.looseEqual = looseEqual;
shared_cjs_prod.looseIndexOf = looseIndexOf;
shared_cjs_prod.makeMap = makeMap;
shared_cjs_prod.normalizeClass = normalizeClass;
shared_cjs_prod.normalizeProps = normalizeProps;
shared_cjs_prod.normalizeStyle = normalizeStyle;
shared_cjs_prod.objectToString = objectToString;
shared_cjs_prod.parseStringStyle = parseStringStyle;
shared_cjs_prod.propsToAttrMap = propsToAttrMap;
shared_cjs_prod.remove = remove;
shared_cjs_prod.slotFlagsText = slotFlagsText;
shared_cjs_prod.stringifyStyle = stringifyStyle;
shared_cjs_prod.toDisplayString = toDisplayString;
shared_cjs_prod.toHandlerKey = toHandlerKey;
shared_cjs_prod.toNumber = toNumber;
shared_cjs_prod.toRawType = toRawType;
shared_cjs_prod.toTypeString = toTypeString;
function useHead(meta2) {
  const resolvedMeta = isFunction_1(meta2) ? vue_cjs_prod.computed(meta2) : meta2;
  useNuxtApp()._useHead(resolvedMeta);
}
function useMeta(meta2) {
  return useHead(meta2);
}
const preload = defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.mixin({
    beforeCreate() {
      const { _registeredComponents } = this.$nuxt.ssrContext;
      const { __moduleIdentifier } = this.$options;
      _registeredComponents.add(__moduleIdentifier);
    }
  });
});
const components = {
  Card: vue_cjs_prod.defineAsyncComponent(() => Promise.resolve().then(function() {
    return Card$1;
  }).then((c2) => c2.default || c2)),
  CardList: vue_cjs_prod.defineAsyncComponent(() => Promise.resolve().then(function() {
    return CardList;
  }).then((c2) => c2.default || c2)),
  Footer: vue_cjs_prod.defineAsyncComponent(() => Promise.resolve().then(function() {
    return Footer;
  }).then((c2) => c2.default || c2)),
  Header: vue_cjs_prod.defineAsyncComponent(() => Promise.resolve().then(function() {
    return Header;
  }).then((c2) => c2.default || c2)),
  Layout: vue_cjs_prod.defineAsyncComponent(() => Promise.resolve().then(function() {
    return Layout$1;
  }).then((c2) => c2.default || c2)),
  Combobox: vue_cjs_prod.defineAsyncComponent(() => Promise.resolve().then(function() {
    return combobox;
  }).then((c2) => c2.default || c2)),
  Description: vue_cjs_prod.defineAsyncComponent(() => Promise.resolve().then(function() {
    return description;
  }).then((c2) => c2.default || c2)),
  Dialog: vue_cjs_prod.defineAsyncComponent(() => Promise.resolve().then(function() {
    return dialog;
  }).then((c2) => c2.default || c2)),
  Disclosure: vue_cjs_prod.defineAsyncComponent(() => Promise.resolve().then(function() {
    return disclosure;
  }).then((c2) => c2.default || c2)),
  FocusTrap: vue_cjs_prod.defineAsyncComponent(() => Promise.resolve().then(function() {
    return focusTrap;
  }).then((c2) => c2.default || c2)),
  Label: vue_cjs_prod.defineAsyncComponent(() => Promise.resolve().then(function() {
    return label;
  }).then((c2) => c2.default || c2)),
  Listbox: vue_cjs_prod.defineAsyncComponent(() => Promise.resolve().then(function() {
    return listbox;
  }).then((c2) => c2.default || c2)),
  Menu: vue_cjs_prod.defineAsyncComponent(() => Promise.resolve().then(function() {
    return menu;
  }).then((c2) => c2.default || c2)),
  Popover: vue_cjs_prod.defineAsyncComponent(() => Promise.resolve().then(function() {
    return popover;
  }).then((c2) => c2.default || c2)),
  Portal: vue_cjs_prod.defineAsyncComponent(() => Promise.resolve().then(function() {
    return portal;
  }).then((c2) => c2.default || c2)),
  RadioGroup: vue_cjs_prod.defineAsyncComponent(() => Promise.resolve().then(function() {
    return radioGroup;
  }).then((c2) => c2.default || c2)),
  Switch: vue_cjs_prod.defineAsyncComponent(() => Promise.resolve().then(function() {
    return _switch;
  }).then((c2) => c2.default || c2)),
  Tabs: vue_cjs_prod.defineAsyncComponent(() => Promise.resolve().then(function() {
    return tabs;
  }).then((c2) => c2.default || c2)),
  TransitionsTransition: vue_cjs_prod.defineAsyncComponent(() => Promise.resolve().then(function() {
    return transition;
  }).then((c2) => c2.default || c2)),
  TransitionsUtilsTransition: vue_cjs_prod.defineAsyncComponent(() => Promise.resolve().then(function() {
    return transition$1;
  }).then((c2) => c2.default || c2))
};
function componentsPlugin_e23f587e(nuxtApp) {
  for (const name in components) {
    nuxtApp.vueApp.component(name, components[name]);
    nuxtApp.vueApp.component("Lazy" + name, components[name]);
  }
}
var __defProp2 = Object.defineProperty;
var __defProps2 = Object.defineProperties;
var __getOwnPropDescs2 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols2 = Object.getOwnPropertySymbols;
var __hasOwnProp2 = Object.prototype.hasOwnProperty;
var __propIsEnum2 = Object.prototype.propertyIsEnumerable;
var __defNormalProp2 = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues2 = (a2, b2) => {
  for (var prop in b2 || (b2 = {}))
    if (__hasOwnProp2.call(b2, prop))
      __defNormalProp2(a2, prop, b2[prop]);
  if (__getOwnPropSymbols2)
    for (var prop of __getOwnPropSymbols2(b2)) {
      if (__propIsEnum2.call(b2, prop))
        __defNormalProp2(a2, prop, b2[prop]);
    }
  return a2;
};
var __spreadProps2 = (a2, b2) => __defProps2(a2, __getOwnPropDescs2(b2));
var PROVIDE_KEY = `usehead`;
var HEAD_COUNT_KEY = `head:count`;
var HEAD_ATTRS_KEY = `data-head-attrs`;
var SELF_CLOSING_TAGS = ["meta", "link", "base"];
var createElement = (tag, attrs, document2) => {
  const el = document2.createElement(tag);
  for (const key of Object.keys(attrs)) {
    let value = attrs[key];
    if (key === "key" || value === false) {
      continue;
    }
    if (key === "children") {
      el.textContent = value;
    } else {
      el.setAttribute(key, value);
    }
  }
  return el;
};
var htmlEscape = (str) => str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
var stringifyAttrs = (attributes) => {
  const handledAttributes = [];
  for (let [key, value] of Object.entries(attributes)) {
    if (key === "children" || key === "key") {
      continue;
    }
    if (value === false || value == null) {
      continue;
    }
    let attribute = htmlEscape(key);
    if (value !== true) {
      attribute += `="${htmlEscape(String(value))}"`;
    }
    handledAttributes.push(attribute);
  }
  return handledAttributes.length > 0 ? " " + handledAttributes.join(" ") : "";
};
function isEqualNode(oldTag, newTag) {
  if (oldTag instanceof HTMLElement && newTag instanceof HTMLElement) {
    const nonce = newTag.getAttribute("nonce");
    if (nonce && !oldTag.getAttribute("nonce")) {
      const cloneTag = newTag.cloneNode(true);
      cloneTag.setAttribute("nonce", "");
      cloneTag.nonce = nonce;
      return nonce === oldTag.nonce && oldTag.isEqualNode(cloneTag);
    }
  }
  return oldTag.isEqualNode(newTag);
}
var getTagKey = (props) => {
  const names = ["key", "id", "name", "property"];
  for (const n2 of names) {
    const value = typeof props.getAttribute === "function" ? props.hasAttribute(n2) ? props.getAttribute(n2) : void 0 : props[n2];
    if (value !== void 0) {
      return { name: n2, value };
    }
  }
};
var acceptFields = [
  "title",
  "meta",
  "link",
  "base",
  "style",
  "script",
  "htmlAttrs",
  "bodyAttrs"
];
var headObjToTags = (obj) => {
  const tags = [];
  for (const key of Object.keys(obj)) {
    if (obj[key] == null)
      continue;
    if (key === "title") {
      tags.push({ tag: key, props: { children: obj[key] } });
    } else if (key === "base") {
      tags.push({ tag: key, props: __spreadValues2({ key: "default" }, obj[key]) });
    } else if (acceptFields.includes(key)) {
      const value = obj[key];
      if (Array.isArray(value)) {
        value.forEach((item) => {
          tags.push({ tag: key, props: item });
        });
      } else if (value) {
        tags.push({ tag: key, props: value });
      }
    }
  }
  return tags;
};
var setAttrs = (el, attrs) => {
  const existingAttrs = el.getAttribute(HEAD_ATTRS_KEY);
  if (existingAttrs) {
    for (const key of existingAttrs.split(",")) {
      if (!(key in attrs)) {
        el.removeAttribute(key);
      }
    }
  }
  const keys = [];
  for (const key in attrs) {
    const value = attrs[key];
    if (value == null)
      continue;
    if (value === false) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, value);
    }
    keys.push(key);
  }
  if (keys.length) {
    el.setAttribute(HEAD_ATTRS_KEY, keys.join(","));
  } else {
    el.removeAttribute(HEAD_ATTRS_KEY);
  }
};
var updateElements = (document2 = window.document, type, tags) => {
  var _a2;
  const head = document2.head;
  let headCountEl = head.querySelector(`meta[name="${HEAD_COUNT_KEY}"]`);
  const headCount = headCountEl ? Number(headCountEl.getAttribute("content")) : 0;
  const oldElements = [];
  if (headCountEl) {
    for (let i2 = 0, j = headCountEl.previousElementSibling; i2 < headCount; i2++, j = (j == null ? void 0 : j.previousElementSibling) || null) {
      if (((_a2 = j == null ? void 0 : j.tagName) == null ? void 0 : _a2.toLowerCase()) === type) {
        oldElements.push(j);
      }
    }
  } else {
    headCountEl = document2.createElement("meta");
    headCountEl.setAttribute("name", HEAD_COUNT_KEY);
    headCountEl.setAttribute("content", "0");
    head.append(headCountEl);
  }
  let newElements = tags.map((tag) => createElement(tag.tag, tag.props, document2));
  newElements = newElements.filter((newEl) => {
    for (let i2 = 0; i2 < oldElements.length; i2++) {
      const oldEl = oldElements[i2];
      if (isEqualNode(oldEl, newEl)) {
        oldElements.splice(i2, 1);
        return false;
      }
    }
    return true;
  });
  oldElements.forEach((t2) => {
    var _a22;
    return (_a22 = t2.parentNode) == null ? void 0 : _a22.removeChild(t2);
  });
  newElements.forEach((t2) => {
    head.insertBefore(t2, headCountEl);
  });
  headCountEl.setAttribute("content", "" + (headCount - oldElements.length + newElements.length));
};
var createHead = () => {
  let allHeadObjs = [];
  let previousTags = /* @__PURE__ */ new Set();
  const head = {
    install(app) {
      app.config.globalProperties.$head = head;
      app.provide(PROVIDE_KEY, head);
    },
    get headTags() {
      const deduped = [];
      allHeadObjs.forEach((objs) => {
        const tags = headObjToTags(objs.value);
        tags.forEach((tag) => {
          if (tag.tag === "meta" || tag.tag === "base" || tag.tag === "script") {
            const key = getTagKey(tag.props);
            if (key) {
              let index2 = -1;
              for (let i2 = 0; i2 < deduped.length; i2++) {
                const prev = deduped[i2];
                const prevValue = prev.props[key.name];
                const nextValue = tag.props[key.name];
                if (prev.tag === tag.tag && prevValue === nextValue) {
                  index2 = i2;
                  break;
                }
              }
              if (index2 !== -1) {
                deduped.splice(index2, 1);
              }
            }
          }
          deduped.push(tag);
        });
      });
      return deduped;
    },
    addHeadObjs(objs) {
      allHeadObjs.push(objs);
    },
    removeHeadObjs(objs) {
      allHeadObjs = allHeadObjs.filter((_objs) => _objs !== objs);
    },
    updateDOM(document2 = window.document) {
      let title;
      let htmlAttrs = {};
      let bodyAttrs = {};
      const actualTags = {};
      for (const tag of head.headTags) {
        if (tag.tag === "title") {
          title = tag.props.children;
          continue;
        }
        if (tag.tag === "htmlAttrs") {
          Object.assign(htmlAttrs, tag.props);
          continue;
        }
        if (tag.tag === "bodyAttrs") {
          Object.assign(bodyAttrs, tag.props);
          continue;
        }
        actualTags[tag.tag] = actualTags[tag.tag] || [];
        actualTags[tag.tag].push(tag);
      }
      if (title !== void 0) {
        document2.title = title;
      }
      setAttrs(document2.documentElement, htmlAttrs);
      setAttrs(document2.body, bodyAttrs);
      const tags = /* @__PURE__ */ new Set([...Object.keys(actualTags), ...previousTags]);
      for (const tag of tags) {
        updateElements(document2, tag, actualTags[tag] || []);
      }
      previousTags.clear();
      Object.keys(actualTags).forEach((i2) => previousTags.add(i2));
    }
  };
  return head;
};
var tagToString = (tag) => {
  let attrs = stringifyAttrs(tag.props);
  if (SELF_CLOSING_TAGS.includes(tag.tag)) {
    return `<${tag.tag}${attrs}>`;
  }
  return `<${tag.tag}${attrs}>${tag.props.children || ""}</${tag.tag}>`;
};
var renderHeadToString = (head) => {
  const tags = [];
  let titleTag = "";
  let htmlAttrs = {};
  let bodyAttrs = {};
  for (const tag of head.headTags) {
    if (tag.tag === "title") {
      titleTag = tagToString(tag);
    } else if (tag.tag === "htmlAttrs") {
      Object.assign(htmlAttrs, tag.props);
    } else if (tag.tag === "bodyAttrs") {
      Object.assign(bodyAttrs, tag.props);
    } else {
      tags.push(tagToString(tag));
    }
  }
  tags.push(`<meta name="${HEAD_COUNT_KEY}" content="${tags.length}">`);
  return {
    get headTags() {
      return titleTag + tags.join("");
    },
    get htmlAttrs() {
      return stringifyAttrs(__spreadProps2(__spreadValues2({}, htmlAttrs), {
        [HEAD_ATTRS_KEY]: Object.keys(htmlAttrs).join(",")
      }));
    },
    get bodyAttrs() {
      return stringifyAttrs(__spreadProps2(__spreadValues2({}, bodyAttrs), {
        [HEAD_ATTRS_KEY]: Object.keys(bodyAttrs).join(",")
      }));
    }
  };
};
function isObject(val) {
  return val !== null && typeof val === "object";
}
function _defu(baseObj, defaults2, namespace = ".", merger) {
  if (!isObject(defaults2)) {
    return _defu(baseObj, {}, namespace, merger);
  }
  const obj = Object.assign({}, defaults2);
  for (const key in baseObj) {
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const val = baseObj[key];
    if (val === null || val === void 0) {
      continue;
    }
    if (merger && merger(obj, key, val, namespace)) {
      continue;
    }
    if (Array.isArray(val) && Array.isArray(obj[key])) {
      obj[key] = val.concat(obj[key]);
    } else if (isObject(val) && isObject(obj[key])) {
      obj[key] = _defu(val, obj[key], (namespace ? `${namespace}.` : "") + key.toString(), merger);
    } else {
      obj[key] = val;
    }
  }
  return obj;
}
function createDefu(merger) {
  return (...args) => args.reduce((p2, c2) => _defu(p2, c2, "", merger), {});
}
const defu = createDefu();
const vueuseHead_56aa5ec0 = defineNuxtPlugin((nuxtApp) => {
  const head = createHead();
  nuxtApp.vueApp.use(head);
  nuxtApp.hooks.hookOnce("app:mounted", () => {
    vue_cjs_prod.watchEffect(() => {
      head.updateDOM();
    });
  });
  const titleTemplate = vue_cjs_prod.ref();
  nuxtApp._useHead = (_meta) => {
    const meta2 = vue_cjs_prod.ref(_meta);
    if ("titleTemplate" in meta2.value) {
      titleTemplate.value = meta2.value.titleTemplate;
    }
    const headObj = vue_cjs_prod.computed(() => {
      const overrides = { meta: [] };
      if (titleTemplate.value && "title" in meta2.value) {
        overrides.title = typeof titleTemplate.value === "function" ? titleTemplate.value(meta2.value.title) : titleTemplate.value.replace(/%s/g, meta2.value.title);
      }
      if (meta2.value.charset) {
        overrides.meta.push({ key: "charset", charset: meta2.value.charset });
      }
      if (meta2.value.viewport) {
        overrides.meta.push({ name: "viewport", content: meta2.value.viewport });
      }
      return defu(overrides, meta2.value);
    });
    head.addHeadObjs(headObj);
    {
      return;
    }
  };
  {
    nuxtApp.ssrContext.renderMeta = () => renderHeadToString(head);
  }
});
const removeUndefinedProps = (props) => Object.fromEntries(Object.entries(props).filter(([, value]) => value !== void 0));
const setupForUseMeta = (metaFactory, renderChild) => (props, ctx) => {
  useHead(() => metaFactory(__spreadValues(__spreadValues({}, removeUndefinedProps(props)), ctx.attrs), ctx));
  return () => {
    var _a2, _b2;
    return renderChild ? (_b2 = (_a2 = ctx.slots).default) == null ? void 0 : _b2.call(_a2) : null;
  };
};
const globalProps = {
  accesskey: String,
  autocapitalize: String,
  autofocus: {
    type: Boolean,
    default: void 0
  },
  class: String,
  contenteditable: {
    type: Boolean,
    default: void 0
  },
  contextmenu: String,
  dir: String,
  draggable: {
    type: Boolean,
    default: void 0
  },
  enterkeyhint: String,
  exportparts: String,
  hidden: {
    type: Boolean,
    default: void 0
  },
  id: String,
  inputmode: String,
  is: String,
  itemid: String,
  itemprop: String,
  itemref: String,
  itemscope: String,
  itemtype: String,
  lang: String,
  nonce: String,
  part: String,
  slot: String,
  spellcheck: {
    type: Boolean,
    default: void 0
  },
  style: String,
  tabindex: String,
  title: String,
  translate: String
};
const Script = vue_cjs_prod.defineComponent({
  name: "Script",
  props: __spreadProps(__spreadValues({}, globalProps), {
    async: Boolean,
    crossorigin: {
      type: [Boolean, String],
      default: void 0
    },
    defer: Boolean,
    integrity: String,
    nomodule: Boolean,
    nonce: String,
    referrerpolicy: String,
    src: String,
    type: String,
    charset: String,
    language: String
  }),
  setup: setupForUseMeta((script2) => ({
    script: [script2]
  }))
});
const Link = vue_cjs_prod.defineComponent({
  name: "Link",
  props: __spreadProps(__spreadValues({}, globalProps), {
    as: String,
    crossorigin: String,
    disabled: Boolean,
    href: String,
    hreflang: String,
    imagesizes: String,
    imagesrcset: String,
    integrity: String,
    media: String,
    prefetch: {
      type: Boolean,
      default: void 0
    },
    referrerpolicy: String,
    rel: String,
    sizes: String,
    title: String,
    type: String,
    methods: String,
    target: String
  }),
  setup: setupForUseMeta((link) => ({
    link: [link]
  }))
});
const Base = vue_cjs_prod.defineComponent({
  name: "Base",
  props: __spreadProps(__spreadValues({}, globalProps), {
    href: String,
    target: String
  }),
  setup: setupForUseMeta((base) => ({
    base
  }))
});
const Title = vue_cjs_prod.defineComponent({
  name: "Title",
  setup: setupForUseMeta((_2, { slots }) => {
    var _a2, _b2, _c;
    const title = ((_c = (_b2 = (_a2 = slots.default) == null ? void 0 : _a2.call(slots)) == null ? void 0 : _b2[0]) == null ? void 0 : _c.children) || null;
    return {
      title
    };
  })
});
const Meta = vue_cjs_prod.defineComponent({
  name: "Meta",
  props: __spreadProps(__spreadValues({}, globalProps), {
    charset: String,
    content: String,
    httpEquiv: String,
    name: String
  }),
  setup: setupForUseMeta((meta2) => ({
    meta: [meta2]
  }))
});
const Style = vue_cjs_prod.defineComponent({
  name: "Style",
  props: __spreadProps(__spreadValues({}, globalProps), {
    type: String,
    media: String,
    nonce: String,
    title: String,
    scoped: {
      type: Boolean,
      default: void 0
    }
  }),
  setup: setupForUseMeta((props, { slots }) => {
    var _a2, _b2, _c;
    const style = __spreadValues({}, props);
    const textContent = (_c = (_b2 = (_a2 = slots.default) == null ? void 0 : _a2.call(slots)) == null ? void 0 : _b2[0]) == null ? void 0 : _c.children;
    if (textContent) {
      style.children = textContent;
    }
    return {
      style: [style]
    };
  })
});
const Head = vue_cjs_prod.defineComponent({
  name: "Head",
  setup: (_props, ctx) => () => {
    var _a2, _b2;
    return (_b2 = (_a2 = ctx.slots).default) == null ? void 0 : _b2.call(_a2);
  }
});
const Html = vue_cjs_prod.defineComponent({
  name: "Html",
  props: __spreadProps(__spreadValues({}, globalProps), {
    manifest: String,
    version: String,
    xmlns: String
  }),
  setup: setupForUseMeta((htmlAttrs) => ({ htmlAttrs }), true)
});
const Body = vue_cjs_prod.defineComponent({
  name: "Body",
  props: globalProps,
  setup: setupForUseMeta((bodyAttrs) => ({ bodyAttrs }), true)
});
const Components = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Script,
  Link,
  Base,
  Title,
  Meta,
  Style,
  Head,
  Html,
  Body
}, Symbol.toStringTag, { value: "Module" }));
const metaConfig = { "globalMeta": { "charset": "utf-8", "viewport": "width=device-width, initial-scale=1", "meta": [], "link": [], "style": [], "script": [] } };
const metaMixin = {
  created() {
    const instance = vue_cjs_prod.getCurrentInstance();
    if (!instance) {
      return;
    }
    const options = instance.type;
    if (!options || !("head" in options)) {
      return;
    }
    const nuxtApp = useNuxtApp();
    const source = typeof options.head === "function" ? vue_cjs_prod.computed(() => options.head(nuxtApp)) : options.head;
    useHead(source);
  }
};
const _0314d298 = defineNuxtPlugin((nuxtApp) => {
  useHead(vue_cjs_prod.markRaw(metaConfig.globalMeta));
  nuxtApp.vueApp.mixin(metaMixin);
  for (const name in Components) {
    nuxtApp.vueApp.component(name, Components[name]);
  }
});
const interpolatePath = (route, match) => {
  return match.path.replace(/(:\w+)\([^)]+\)/g, "$1").replace(/(:\w+)[?+*]/g, "$1").replace(/:\w+/g, (r2) => {
    var _a2;
    return ((_a2 = route.params[r2.slice(1)]) == null ? void 0 : _a2.toString()) || "";
  });
};
const generateRouteKey = (override, routeProps) => {
  var _a2;
  const matchedRoute = routeProps.route.matched.find((m2) => m2.components.default === routeProps.Component.type);
  const source = (_a2 = override != null ? override : matchedRoute == null ? void 0 : matchedRoute.meta.key) != null ? _a2 : interpolatePath(routeProps.route, matchedRoute);
  return typeof source === "function" ? source(routeProps.route) : source;
};
const wrapInKeepAlive = (props, children) => {
  return { default: () => children };
};
const Fragment = {
  setup(_props, { slots }) {
    return () => {
      var _a2;
      return (_a2 = slots.default) == null ? void 0 : _a2.call(slots);
    };
  }
};
const _wrapIf = (component, props, slots) => {
  return { default: () => props ? vue_cjs_prod.h(component, props === true ? {} : props, slots) : vue_cjs_prod.h(Fragment, {}, slots) };
};
const isNestedKey = Symbol("isNested");
const NuxtPage = vue_cjs_prod.defineComponent({
  name: "NuxtPage",
  props: {
    pageKey: {
      type: [Function, String],
      default: null
    }
  },
  setup(props) {
    const nuxtApp = useNuxtApp();
    const isNested = vue_cjs_prod.inject(isNestedKey, false);
    vue_cjs_prod.provide(isNestedKey, true);
    return () => {
      return vue_cjs_prod.h(vueRouter_cjs_prod.RouterView, {}, {
        default: (routeProps) => {
          var _a2;
          return routeProps.Component && _wrapIf(vue_cjs_prod.Transition, (_a2 = routeProps.route.meta.pageTransition) != null ? _a2 : defaultPageTransition, wrapInKeepAlive(routeProps.route.meta.keepalive, isNested && nuxtApp.isHydrating ? vue_cjs_prod.h(routeProps.Component, { key: generateRouteKey(props.pageKey, routeProps) }) : vue_cjs_prod.h(vue_cjs_prod.Suspense, {
            onPending: () => nuxtApp.callHook("page:start", routeProps.Component),
            onResolve: () => nuxtApp.callHook("page:finish", routeProps.Component)
          }, { default: () => vue_cjs_prod.h(routeProps.Component, { key: generateRouteKey(props.pageKey, routeProps) }) }))).default();
        }
      });
    };
  }
});
const defaultPageTransition = { name: "page", mode: "out-in" };
const _hoisted_1 = {
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 32 32",
  width: "1.2em",
  height: "1.2em"
};
const _hoisted_2 = /* @__PURE__ */ vue_cjs_prod.createElementVNode("path", {
  fill: "currentColor",
  d: "M16 2a14 14 0 1 0 14 14A14 14 0 0 0 16 2Zm0 26a12 12 0 1 1 12-12a12 12 0 0 1-12 12Z"
}, null, -1);
const _hoisted_3 = /* @__PURE__ */ vue_cjs_prod.createElementVNode("path", {
  fill: "currentColor",
  d: "M15 8h2v11h-2zm1 14a1.5 1.5 0 1 0 1.5 1.5A1.5 1.5 0 0 0 16 22z"
}, null, -1);
const _hoisted_4 = [
  _hoisted_2,
  _hoisted_3
];
function render(_ctx, _cache) {
  return vue_cjs_prod.openBlock(), vue_cjs_prod.createElementBlock("svg", _hoisted_1, _hoisted_4);
}
const CarbonWarning = { name: "carbon-warning", render };
const _sfc_main$e = /* @__PURE__ */ vue_cjs_prod.defineComponent({
  __ssrInlineRender: true,
  setup(__props) {
    useRouter();
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<main${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "text-center text-teal-700 dark:text-gray-200" }, _attrs))}><div text-4xl>`);
      _push(serverRenderer.exports.ssrRenderComponent(vue_cjs_prod.unref(CarbonWarning), { class: "inline-block" }, null, _parent));
      _push(`</div><div>Not found</div><div><button type="button" class="text-sm m-3"> Back </button></div></main>`);
    };
  }
});
const _sfc_setup$e = _sfc_main$e.setup;
_sfc_main$e.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/404.vue");
  return _sfc_setup$e ? _sfc_setup$e(props, ctx) : void 0;
};
const meta$2 = void 0;
const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const meta$1 = void 0;
function tryOnScopeDispose(fn) {
  if (vue_cjs_prod.getCurrentScope()) {
    vue_cjs_prod.onScopeDispose(fn);
    return true;
  }
  return false;
}
const isClient = false;
function useIntervalFn(cb, interval = 1e3, options) {
  const {
    immediate = true,
    immediateCallback = false
  } = options;
  let timer = null;
  const isActive = vue_cjs_prod.ref(false);
  function clean() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
  function pause() {
    isActive.value = false;
    clean();
  }
  function resume() {
    if (interval <= 0)
      return;
    isActive.value = true;
    if (immediateCallback)
      cb();
    clean();
    timer = setInterval(cb, vue_cjs_prod.unref(interval));
  }
  if (immediate && isClient)
    resume();
  if (vue_cjs_prod.isRef(interval)) {
    const stopWatch = vue_cjs_prod.watch(interval, () => {
      if (immediate && isClient)
        resume();
    });
    tryOnScopeDispose(stopWatch);
  }
  tryOnScopeDispose(pause);
  return {
    isActive,
    pause,
    resume
  };
}
const defaultWindow = void 0;
const _global = typeof globalThis !== "undefined" ? globalThis : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
const globalKey = "__vueuse_ssr_handlers__";
_global[globalKey] = _global[globalKey] || {};
const handlers = _global[globalKey];
function setSSRHandler(key, fn) {
  handlers[key] = fn;
}
function useRafFn(fn, options) {
  const {
    immediate = true,
    window: window2 = defaultWindow
  } = options;
  const isActive = vue_cjs_prod.ref(false);
  let rafId = null;
  function loop() {
    if (!isActive.value || !window2)
      return;
    fn();
    rafId = window2.requestAnimationFrame(loop);
  }
  function resume() {
    if (!isActive.value && window2) {
      isActive.value = true;
      loop();
    }
  }
  function pause() {
    isActive.value = false;
    if (rafId != null && window2) {
      window2.cancelAnimationFrame(rafId);
      rafId = null;
    }
  }
  if (immediate)
    resume();
  tryOnScopeDispose(pause);
  return {
    isActive,
    pause,
    resume
  };
}
var __defProp$5 = Object.defineProperty;
var __getOwnPropSymbols$5 = Object.getOwnPropertySymbols;
var __hasOwnProp$5 = Object.prototype.hasOwnProperty;
var __propIsEnum$5 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$5 = (obj, key, value) => key in obj ? __defProp$5(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$5 = (a2, b2) => {
  for (var prop in b2 || (b2 = {}))
    if (__hasOwnProp$5.call(b2, prop))
      __defNormalProp$5(a2, prop, b2[prop]);
  if (__getOwnPropSymbols$5)
    for (var prop of __getOwnPropSymbols$5(b2)) {
      if (__propIsEnum$5.call(b2, prop))
        __defNormalProp$5(a2, prop, b2[prop]);
    }
  return a2;
};
function useNow(options) {
  const {
    controls: exposeControls = false,
    interval = "requestAnimationFrame"
  } = options;
  const now = vue_cjs_prod.ref(new Date());
  const update = () => now.value = new Date();
  const controls = interval === "requestAnimationFrame" ? useRafFn(update, { immediate: true }) : useIntervalFn(update, interval, { immediate: true });
  if (exposeControls) {
    return __spreadValues$5({
      now
    }, controls);
  } else {
    return now;
  }
}
var __defProp$1 = Object.defineProperty;
var __getOwnPropSymbols$1 = Object.getOwnPropertySymbols;
var __hasOwnProp$1 = Object.prototype.hasOwnProperty;
var __propIsEnum$1 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$1 = (a2, b2) => {
  for (var prop in b2 || (b2 = {}))
    if (__hasOwnProp$1.call(b2, prop))
      __defNormalProp$1(a2, prop, b2[prop]);
  if (__getOwnPropSymbols$1)
    for (var prop of __getOwnPropSymbols$1(b2)) {
      if (__propIsEnum$1.call(b2, prop))
        __defNormalProp$1(a2, prop, b2[prop]);
    }
  return a2;
};
var __objRest2 = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp$1.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols$1)
    for (var prop of __getOwnPropSymbols$1(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum$1.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
const UNITS = [
  { max: 6e4, value: 1e3, name: "second" },
  { max: 276e4, value: 6e4, name: "minute" },
  { max: 72e6, value: 36e5, name: "hour" },
  { max: 5184e5, value: 864e5, name: "day" },
  { max: 24192e5, value: 6048e5, name: "week" },
  { max: 28512e6, value: 2592e6, name: "month" },
  { max: Infinity, value: 31536e6, name: "year" }
];
const DEFAULT_MESSAGES = {
  justNow: "just now",
  past: (n2) => n2.match(/\d/) ? `${n2} ago` : n2,
  future: (n2) => n2.match(/\d/) ? `in ${n2}` : n2,
  month: (n2, past) => n2 === 1 ? past ? "last month" : "next month" : `${n2} month${n2 > 1 ? "s" : ""}`,
  year: (n2, past) => n2 === 1 ? past ? "last year" : "next year" : `${n2} year${n2 > 1 ? "s" : ""}`,
  day: (n2, past) => n2 === 1 ? past ? "yesterday" : "tomorrow" : `${n2} day${n2 > 1 ? "s" : ""}`,
  week: (n2, past) => n2 === 1 ? past ? "last week" : "next week" : `${n2} week${n2 > 1 ? "s" : ""}`,
  hour: (n2) => `${n2} hour${n2 > 1 ? "s" : ""}`,
  minute: (n2) => `${n2} minute${n2 > 1 ? "s" : ""}`,
  second: (n2) => `${n2} second${n2 > 1 ? "s" : ""}`
};
const DEFAULT_FORMATTER = (date) => date.toISOString().slice(0, 10);
function useTimeAgo(time, options = {}) {
  const {
    controls: exposeControls = false,
    max,
    updateInterval = 3e4,
    messages = DEFAULT_MESSAGES,
    fullDateFormatter = DEFAULT_FORMATTER
  } = options;
  const { abs, round } = Math;
  const _a2 = useNow({ interval: updateInterval, controls: true }), { now } = _a2, controls = __objRest2(_a2, ["now"]);
  function getTimeago(from, now2) {
    var _a22;
    const diff = +now2 - +from;
    const absDiff = abs(diff);
    if (absDiff < 6e4)
      return messages.justNow;
    if (typeof max === "number" && absDiff > max)
      return fullDateFormatter(new Date(from));
    if (typeof max === "string") {
      const unitMax = (_a22 = UNITS.find((i2) => i2.name === max)) == null ? void 0 : _a22.max;
      if (unitMax && absDiff > unitMax)
        return fullDateFormatter(new Date(from));
    }
    for (const unit of UNITS) {
      if (absDiff < unit.max)
        return format(diff, unit);
    }
  }
  function applyFormat(name, val, isPast) {
    const formatter = messages[name];
    if (typeof formatter === "function")
      return formatter(val, isPast);
    return formatter.replace("{0}", val.toString());
  }
  function format(diff, unit) {
    const val = round(abs(diff) / unit.value);
    const past = diff > 0;
    const str = applyFormat(unit.name, val, past);
    return applyFormat(past ? "past" : "future", str, past);
  }
  const timeAgo = vue_cjs_prod.computed(() => getTimeago(new Date(vue_cjs_prod.unref(time)), vue_cjs_prod.unref(now.value)));
  if (exposeControls) {
    return __spreadValues$1({
      timeAgo
    }, controls);
  } else {
    return timeAgo;
  }
}
const _sfc_main$d = {
  props: {
    product: {
      type: Object
    }
  },
  methods: {
    timeAgo(date) {
      return useTimeAgo(date);
    },
    showContent(x2) {
      return x2.replace(/[\(\[].*?[\)\]]/g, "");
    }
  }
};
function _sfc_ssrRender$6(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "w-full lg:max-w-full lg:flex" }, _attrs))}><img class="h-48 lg:h-auto lg:w-48 flex-none rounded-t lg:rounded-t-none lg:rounded-l text-center overflow-hidden"${serverRenderer.exports.ssrRenderAttr("src", $props.product.urlToImage)} alt=""><div class="border-r border-b border-l border-gray-400 lg:border-l-0 lg:border-t lg:border-gray-400 bg-white rounded-b lg:rounded-b-none lg:rounded-r p-4 flex flex-col justify-between leading-normal"><div class="mb-8"><p class="text-sm text-gray-600 flex items-center"> Channel : ${serverRenderer.exports.ssrInterpolate($props.product.source.name)}</p><div class="text-gray-900 font-bold text-xl mb-2">${serverRenderer.exports.ssrInterpolate($props.product.title)}</div><p class="text-gray-700 text-base">${serverRenderer.exports.ssrInterpolate($props.product.description)}</p><p class="text-gray-700 text-sm">${serverRenderer.exports.ssrInterpolate($options.showContent($props.product.content))} <a${serverRenderer.exports.ssrRenderAttr("href", $props.product.url)} class="text-blue-600">Read more ...</a></p></div><div class="flex items-center"><div class="text-sm"><p class="text-gray-900 leading-none"> Author : ${serverRenderer.exports.ssrInterpolate($props.product.author)}</p><p class="text-gray-600"> Time : ${serverRenderer.exports.ssrInterpolate($options.timeAgo($props.product.publishedAt))}</p></div></div></div></div>`);
}
const _sfc_setup$d = _sfc_main$d.setup;
_sfc_main$d.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/CardList.vue");
  return _sfc_setup$d ? _sfc_setup$d(props, ctx) : void 0;
};
const __nuxt_component_0$1 = /* @__PURE__ */ _export_sfc(_sfc_main$d, [["ssrRender", _sfc_ssrRender$6]]);
const CardList = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  "default": __nuxt_component_0$1
}, Symbol.toStringTag, { value: "Module" }));
const meta = void 0;
const routes = [
  {
    name: "404",
    path: "/:catchAll(.*)*",
    file: "D:/newsApi/nuxt3-tailwindcss3-starter-kit/pages/404.vue",
    children: [],
    meta: meta$2,
    alias: [],
    component: () => Promise.resolve().then(function() {
      return _404;
    })
  },
  {
    name: "index",
    path: "/",
    file: "D:/newsApi/nuxt3-tailwindcss3-starter-kit/pages/index.vue",
    children: [],
    meta: meta$1,
    alias: [],
    component: () => Promise.resolve().then(function() {
      return index$1;
    })
  },
  {
    name: "my",
    path: "/my",
    file: "D:/newsApi/nuxt3-tailwindcss3-starter-kit/pages/my.vue",
    children: [],
    meta,
    alias: [],
    component: () => Promise.resolve().then(function() {
      return my;
    })
  }
];
const configRouterOptions = {};
const routerOptions = __spreadValues({}, configRouterOptions);
const globalMiddleware = [];
const namedMiddleware = {};
const _d2b2fde0 = defineNuxtPlugin(async (nuxtApp) => {
  nuxtApp.vueApp.component("NuxtPage", NuxtPage);
  nuxtApp.vueApp.component("NuxtNestedPage", NuxtPage);
  nuxtApp.vueApp.component("NuxtChild", NuxtPage);
  const baseURL2 = useRuntimeConfig().app.baseURL;
  const routerHistory = vueRouter_cjs_prod.createMemoryHistory(baseURL2);
  const initialURL = nuxtApp.ssrContext.url;
  const router = vueRouter_cjs_prod.createRouter(__spreadProps(__spreadValues({}, routerOptions), {
    history: routerHistory,
    routes
  }));
  nuxtApp.vueApp.use(router);
  const previousRoute = vue_cjs_prod.shallowRef(router.currentRoute.value);
  router.afterEach((_to, from) => {
    previousRoute.value = from;
  });
  Object.defineProperty(nuxtApp.vueApp.config.globalProperties, "previousRoute", {
    get: () => previousRoute.value
  });
  const route = {};
  for (const key in router.currentRoute.value) {
    route[key] = vue_cjs_prod.computed(() => router.currentRoute.value[key]);
  }
  const _activeRoute = vue_cjs_prod.shallowRef(router.resolve(initialURL));
  const syncCurrentRoute = () => {
    _activeRoute.value = router.currentRoute.value;
  };
  nuxtApp.hook("page:finish", syncCurrentRoute);
  router.afterEach((to, from) => {
    var _a2, _b2, _c, _d;
    if (((_b2 = (_a2 = to.matched[0]) == null ? void 0 : _a2.components) == null ? void 0 : _b2.default) === ((_d = (_c = from.matched[0]) == null ? void 0 : _c.components) == null ? void 0 : _d.default)) {
      syncCurrentRoute();
    }
  });
  const activeRoute = {};
  for (const key in _activeRoute.value) {
    activeRoute[key] = vue_cjs_prod.computed(() => _activeRoute.value[key]);
  }
  nuxtApp._route = vue_cjs_prod.reactive(route);
  nuxtApp._activeRoute = vue_cjs_prod.reactive(activeRoute);
  nuxtApp._middleware = nuxtApp._middleware || {
    global: [],
    named: {}
  };
  useError();
  router.afterEach(async (to) => {
    if (to.matched.length === 0) {
      callWithNuxt(nuxtApp, throwError, [createError({
        statusCode: 404,
        statusMessage: `Page not found: ${to.fullPath}`
      })]);
    } else if (to.matched[0].name === "404" && nuxtApp.ssrContext) {
      nuxtApp.ssrContext.res.statusCode = 404;
    }
  });
  try {
    if (true) {
      await router.push(initialURL);
    }
    await router.isReady();
  } catch (error2) {
    callWithNuxt(nuxtApp, throwError, [error2]);
  }
  router.beforeEach(async (to, from) => {
    var _a2;
    to.meta = vue_cjs_prod.reactive(to.meta);
    nuxtApp._processingMiddleware = true;
    const middlewareEntries = /* @__PURE__ */ new Set([...globalMiddleware, ...nuxtApp._middleware.global]);
    for (const component of to.matched) {
      const componentMiddleware = component.meta.middleware;
      if (!componentMiddleware) {
        continue;
      }
      if (Array.isArray(componentMiddleware)) {
        for (const entry2 of componentMiddleware) {
          middlewareEntries.add(entry2);
        }
      } else {
        middlewareEntries.add(componentMiddleware);
      }
    }
    for (const entry2 of middlewareEntries) {
      const middleware = typeof entry2 === "string" ? nuxtApp._middleware.named[entry2] || await ((_a2 = namedMiddleware[entry2]) == null ? void 0 : _a2.call(namedMiddleware).then((r2) => r2.default || r2)) : entry2;
      const result = await callWithNuxt(nuxtApp, middleware, [to, from]);
      {
        if (result === false || result instanceof Error) {
          const error2 = result || createError({
            statusMessage: `Route navigation aborted: ${initialURL}`
          });
          return callWithNuxt(nuxtApp, throwError, [error2]);
        }
      }
      if (result || result === false) {
        return result;
      }
    }
  });
  router.afterEach(async (to) => {
    delete nuxtApp._processingMiddleware;
    {
      const currentURL = to.fullPath || "/";
      if (!isEqual(currentURL, initialURL)) {
        await callWithNuxt(nuxtApp, navigateTo, [currentURL]);
      }
    }
  });
  nuxtApp.hooks.hookOnce("app:created", async () => {
    try {
      await router.replace(__spreadProps(__spreadValues({}, router.resolve(initialURL)), {
        force: true
      }));
    } catch (error2) {
      callWithNuxt(nuxtApp, throwError, [error2]);
    }
  });
  return { provide: { router } };
});
const preference = "system";
const script = 'const w=window,de=document.documentElement,knownColorSchemes=["dark","light"],preference=window.localStorage.getItem("nuxt-color-mode")||"system";let value=preference==="system"?getColorScheme():preference;const forcedColorMode=de.getAttribute("data-color-mode-forced");forcedColorMode&&(value=forcedColorMode),addClass(value),w["__NUXT_COLOR_MODE__"]={preference,value,getColorScheme,addClass,removeClass};function addClass(e){const o=""+e+"";de.classList?de.classList.add(o):de.className+=" "+o}function removeClass(e){const o=""+e+"";de.classList?de.classList.remove(o):de.className=de.className.replace(new RegExp(o,"g"),"")}function prefersColorScheme(e){return w.matchMedia("(prefers-color-scheme"+e+")")}function getColorScheme(){if(w.matchMedia&&prefersColorScheme("").media!=="not all"){for(const e of knownColorSchemes)if(prefersColorScheme(":"+e).matches)return e}return"light"}\n';
const plugin_c44ea5ec = defineNuxtPlugin((nuxtApp) => {
  const colorMode = useState("color-mode", () => vue_cjs_prod.reactive({
    preference,
    value: preference,
    unknown: true,
    forced: false
  })).value;
  const htmlAttrs = {};
  {
    useHead({
      htmlAttrs,
      script: [{ children: script }]
    });
  }
  useRouter().afterEach((to) => {
    const forcedColorMode = to.meta.colorMode;
    if (forcedColorMode && forcedColorMode !== "system") {
      colorMode.value = htmlAttrs["data-color-mode-forced"] = forcedColorMode;
      colorMode.forced = true;
    } else if (forcedColorMode === "system") {
      console.warn("You cannot force the colorMode to system at the page level.");
    }
  });
  nuxtApp.provide("colorMode", colorMode);
});
const PiniaNuxtPlugin = (context, inject2) => {
  const pinia = createPinia();
  {
    context.vueApp.use(pinia);
  }
  inject2("pinia", pinia);
  context.pinia = pinia;
  setActivePinia(pinia);
  pinia._p.push(({ store }) => {
    Object.defineProperty(store, "$nuxt", { value: context });
  });
  {
    {
      context.nuxtState.pinia = pinia.state.value;
    }
  }
};
setSSRHandler("getDefaultStorage", () => {
  const cookieMap = /* @__PURE__ */ new Map();
  const get = (key) => {
    if (!cookieMap.get(key))
      cookieMap.set(key, useCookie(key, { maxAge: 2147483646 }));
    return cookieMap.get(key);
  };
  return {
    getItem: (key) => get(key).value,
    setItem: (key, value) => get(key).value = value,
    removeItem: (key) => get(key).value = void 0
  };
});
{
  setSSRHandler("updateHTMLAttrs", (selector, attr, value) => {
    if (selector === "html") {
      useMeta({
        htmlAttrs: {
          [attr]: value
        }
      });
    } else if (selector === "body") {
      useMeta({
        bodyAttrs: {
          [attr]: value
        }
      });
    } else {
      throw new Error(`Unsupported meta selector "${selector}" in SSR`);
    }
  });
}
const ssrPlugin_0a82cbda = () => {
};
const _plugins = [
  preload,
  componentsPlugin_e23f587e,
  vueuseHead_56aa5ec0,
  _0314d298,
  _d2b2fde0,
  plugin_c44ea5ec,
  PiniaNuxtPlugin,
  ssrPlugin_0a82cbda
];
const _sfc_main$c = {
  __ssrInlineRender: true,
  props: {
    appName: {
      type: String,
      default: "Nuxt"
    },
    version: {
      type: String,
      default: ""
    },
    statusCode: {
      type: String,
      default: "404"
    },
    statusMessage: {
      type: String,
      default: "Not Found"
    },
    description: {
      type: String,
      default: "Sorry, the page you are looking for could not be found."
    },
    backHome: {
      type: String,
      default: "Go back home"
    }
  },
  setup(__props) {
    const props = __props;
    useHead({
      title: `${props.statusCode} - ${props.statusMessage} | ${props.appName}`,
      script: [],
      style: [
        {
          children: `*,:before,:after{-webkit-box-sizing:border-box;box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}*{--tw-ring-inset:var(--tw-empty, );--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(14, 165, 233, .5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000}:root{-moz-tab-size:4;-o-tab-size:4;tab-size:4}a{color:inherit;text-decoration:inherit}body{margin:0;font-family:inherit;line-height:inherit}html{-webkit-text-size-adjust:100%;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,"Apple Color Emoji","Segoe UI Emoji",Segoe UI Symbol,"Noto Color Emoji";line-height:1.5}h1,p{margin:0}h1{font-size:inherit;font-weight:inherit}`
        }
      ]
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$2;
      _push(`<div${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "font-sans antialiased bg-white dark:bg-black text-black dark:text-white grid min-h-screen place-content-center overflow-hidden" }, _attrs))} data-v-49db1bb2><div class="fixed left-0 right-0 spotlight z-10" data-v-49db1bb2></div><div class="max-w-520px text-center z-20" data-v-49db1bb2><h1 class="text-8xl sm:text-10xl font-medium mb-8" data-v-49db1bb2>${serverRenderer.exports.ssrInterpolate(__props.statusCode)}</h1><p class="text-xl px-8 sm:px-0 sm:text-4xl font-light mb-16 leading-tight" data-v-49db1bb2>${serverRenderer.exports.ssrInterpolate(__props.description)}</p><div class="w-full flex items-center justify-center" data-v-49db1bb2>`);
      _push(serverRenderer.exports.ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "gradient-border text-md sm:text-xl py-2 px-4 sm:py-3 sm:px-6 cursor-pointer"
      }, {
        default: vue_cjs_prod.withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${serverRenderer.exports.ssrInterpolate(__props.backHome)}`);
          } else {
            return [
              vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(__props.backHome), 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div></div>`);
    };
  }
};
const _sfc_setup$c = _sfc_main$c.setup;
_sfc_main$c.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/@nuxt+ui-templates@0.1.1/node_modules/@nuxt/ui-templates/dist/templates/error-404.vue");
  return _sfc_setup$c ? _sfc_setup$c(props, ctx) : void 0;
};
const Error404 = /* @__PURE__ */ _export_sfc(_sfc_main$c, [["__scopeId", "data-v-49db1bb2"]]);
const _sfc_main$b = {
  __ssrInlineRender: true,
  props: {
    appName: {
      type: String,
      default: "Nuxt"
    },
    version: {
      type: String,
      default: ""
    },
    statusCode: {
      type: String,
      default: "500"
    },
    statusMessage: {
      type: String,
      default: "Server error"
    },
    description: {
      type: String,
      default: "This page is temporarily unavailable."
    }
  },
  setup(__props) {
    const props = __props;
    useHead({
      title: `${props.statusCode} - ${props.statusMessage} | ${props.appName}`,
      script: [],
      style: [
        {
          children: `*,:before,:after{-webkit-box-sizing:border-box;box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}*{--tw-ring-inset:var(--tw-empty, );--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(14, 165, 233, .5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000}:root{-moz-tab-size:4;-o-tab-size:4;tab-size:4}body{margin:0;font-family:inherit;line-height:inherit}html{-webkit-text-size-adjust:100%;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,"Apple Color Emoji","Segoe UI Emoji",Segoe UI Symbol,"Noto Color Emoji";line-height:1.5}h1,p{margin:0}h1{font-size:inherit;font-weight:inherit}`
        }
      ]
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "font-sans antialiased bg-white dark:bg-black text-black dark:text-white grid min-h-screen place-content-center overflow-hidden" }, _attrs))} data-v-48d28fca><div class="fixed -bottom-1/2 left-0 right-0 h-1/2 spotlight" data-v-48d28fca></div><div class="max-w-520px text-center" data-v-48d28fca><h1 class="text-8xl sm:text-10xl font-medium mb-8" data-v-48d28fca>${serverRenderer.exports.ssrInterpolate(__props.statusCode)}</h1><p class="text-xl px-8 sm:px-0 sm:text-4xl font-light mb-16 leading-tight" data-v-48d28fca>${serverRenderer.exports.ssrInterpolate(__props.description)}</p></div></div>`);
    };
  }
};
const _sfc_setup$b = _sfc_main$b.setup;
_sfc_main$b.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/@nuxt+ui-templates@0.1.1/node_modules/@nuxt/ui-templates/dist/templates/error-500.vue");
  return _sfc_setup$b ? _sfc_setup$b(props, ctx) : void 0;
};
const Error500 = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["__scopeId", "data-v-48d28fca"]]);
const _sfc_main$9 = {
  __ssrInlineRender: true,
  props: {
    error: Object
  },
  setup(__props) {
    var _a2;
    const props = __props;
    const error = props.error;
    (error.stack || "").split("\n").splice(1).map((line) => {
      const text = line.replace("webpack:/", "").replace(".vue", ".js").trim();
      return {
        text,
        internal: line.includes("node_modules") && !line.includes(".cache") || line.includes("internal") || line.includes("new Promise")
      };
    }).map((i2) => `<span class="stack${i2.internal ? " internal" : ""}">${i2.text}</span>`).join("\n");
    const statusCode = String(error.statusCode || 500);
    const is404 = statusCode === "404";
    const statusMessage = (_a2 = error.statusMessage) != null ? _a2 : is404 ? "Page Not Found" : "Internal Server Error";
    const description2 = error.message || error.toString();
    const stack = void 0;
    const ErrorTemplate = is404 ? Error404 : Error500;
    return (_ctx, _push, _parent, _attrs) => {
      _push(serverRenderer.exports.ssrRenderComponent(vue_cjs_prod.unref(ErrorTemplate), vue_cjs_prod.mergeProps({ statusCode: vue_cjs_prod.unref(statusCode), statusMessage: vue_cjs_prod.unref(statusMessage), description: vue_cjs_prod.unref(description2), stack: vue_cjs_prod.unref(stack) }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup$9 = _sfc_main$9.setup;
_sfc_main$9.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/nuxt@3.0.0-rc.3/node_modules/nuxt/dist/app/components/nuxt-error-page.vue");
  return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
const _sfc_main$8 = {
  __ssrInlineRender: true,
  setup(__props) {
    const nuxtApp = useNuxtApp();
    nuxtApp.hooks.callHookWith((hooks) => hooks.map((hook) => hook()), "vue:setup");
    const error = useError();
    vue_cjs_prod.onErrorCaptured((err, target, info) => {
      nuxtApp.hooks.callHook("vue:error", err, target, info).catch((hookError) => console.error("[nuxt] Error in `vue:error` hook", hookError));
      {
        callWithNuxt(nuxtApp, throwError, [err]);
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_App = vue_cjs_prod.resolveComponent("App");
      serverRenderer.exports.ssrRenderSuspense(_push, {
        default: () => {
          if (vue_cjs_prod.unref(error)) {
            _push(serverRenderer.exports.ssrRenderComponent(vue_cjs_prod.unref(_sfc_main$9), { error: vue_cjs_prod.unref(error) }, null, _parent));
          } else {
            _push(serverRenderer.exports.ssrRenderComponent(_component_App, null, null, _parent));
          }
        },
        _: 1
      });
    };
  }
};
const _sfc_setup$8 = _sfc_main$8.setup;
_sfc_main$8.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/nuxt@3.0.0-rc.3/node_modules/nuxt/dist/app/components/nuxt-root.vue");
  return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
const _sfc_main$7 = {};
function _sfc_ssrRender$5(_ctx, _push, _parent, _attrs) {
  _push(`<header${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "flex justify-center py-6 bg-blue-900 place-items-center" }, _attrs))}><span class="ml-4 text-lg font-bold text-green-100 md:text-xl"> Vue News | Meeta&#39;s Edition </span></header>`);
}
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Header.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["ssrRender", _sfc_ssrRender$5]]);
const Header = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  "default": __nuxt_component_0
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$6 = {};
function _sfc_ssrRender$4(_ctx, _push, _parent, _attrs) {
  _push(`<footer${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "px-4 py-8 text-sm font-bold text-center text-green-100 bg-teal-900" }, _attrs))}><p class="text-sm tracking-wide"> Copyright (c) 2022 Meeta Haldar </p></footer>`);
}
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Footer.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["ssrRender", _sfc_ssrRender$4]]);
const Footer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  "default": __nuxt_component_1
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$5 = {};
function _sfc_ssrRender$3(_ctx, _push, _parent, _attrs) {
  const _component_Header = __nuxt_component_0;
  const _component_NuxtPage = vue_cjs_prod.resolveComponent("NuxtPage");
  const _component_Footer = __nuxt_component_1;
  _push(`<!--[-->`);
  _push(serverRenderer.exports.ssrRenderComponent(_component_Header, null, null, _parent));
  _push(serverRenderer.exports.ssrRenderComponent(_component_NuxtPage, null, null, _parent));
  _push(serverRenderer.exports.ssrRenderComponent(_component_Footer, null, null, _parent));
  _push(`<!--]-->`);
}
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("app.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const AppComponent = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["ssrRender", _sfc_ssrRender$3]]);
if (!globalThis.$fetch) {
  globalThis.$fetch = $fetch$1.create({
    baseURL: baseURL()
  });
}
let entry;
const plugins = normalizePlugins(_plugins);
{
  entry = async function createNuxtAppServer(ssrContext = {}) {
    const vueApp = vue_cjs_prod.createApp(_sfc_main$8);
    vueApp.component("App", AppComponent);
    const nuxt = createNuxtApp({ vueApp, ssrContext });
    try {
      await applyPlugins(nuxt, plugins);
      await nuxt.hooks.callHook("app:created", vueApp);
    } catch (err) {
      await nuxt.callHook("app:error", err);
      ssrContext.error = ssrContext.error || err;
    }
    return vueApp;
  };
}
const entry$1 = (ctx) => entry(ctx);
const _sfc_main$4 = {};
function _sfc_ssrRender$2(_ctx, _push, _parent, _attrs) {
  const _component_CardList = __nuxt_component_0$1;
  _push(`<div${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "p-10 grid grid-cols-2 gap-4" }, _attrs))}>`);
  _push(serverRenderer.exports.ssrRenderComponent(_component_CardList, null, null, _parent));
  _push(`</div>`);
}
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Card.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const Card = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["ssrRender", _sfc_ssrRender$2]]);
const Card$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  "default": Card
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$3 = {};
function _sfc_ssrRender$1(_ctx, _push, _parent, _attrs) {
  const _component_Header = __nuxt_component_0;
  const _component_Footer = __nuxt_component_1;
  _push(`<!--[-->`);
  _push(serverRenderer.exports.ssrRenderComponent(_component_Header, null, null, _parent));
  _push(`<main class="container flex-grow px-4 mx-auto my-12">`);
  serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
  _push(`</main>`);
  _push(serverRenderer.exports.ssrRenderComponent(_component_Footer, null, null, _parent));
  _push(`<!--]-->`);
}
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Layout.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const Layout = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["ssrRender", _sfc_ssrRender$1]]);
const Layout$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  "default": Layout
}, Symbol.toStringTag, { value: "Module" }));
function u$4(r2, n2, ...a2) {
  if (r2 in n2) {
    let e2 = n2[r2];
    return typeof e2 == "function" ? e2(...a2) : e2;
  }
  let t2 = new Error(`Tried to handle "${r2}" but there is no handler defined. Only defined handlers are: ${Object.keys(n2).map((e2) => `"${e2}"`).join(", ")}.`);
  throw Error.captureStackTrace && Error.captureStackTrace(t2, u$4), t2;
}
var m$1 = ((t2) => (t2[t2.None = 0] = "None", t2[t2.RenderStrategy = 1] = "RenderStrategy", t2[t2.Static = 2] = "Static", t2))(m$1 || {}), h$3 = ((e2) => (e2[e2.Unmount = 0] = "Unmount", e2[e2.Hidden = 1] = "Hidden", e2))(h$3 || {});
function k(_a2) {
  var _b2 = _a2, { visible: n2 = true, features: r2 = 0 } = _b2, e2 = __objRest(_b2, ["visible", "features"]);
  var t2;
  if (n2 || r2 & 2 && e2.props.static)
    return a$3(e2);
  if (r2 & 1) {
    let i2 = (t2 = e2.props.unmount) == null || t2 ? 0 : 1;
    return u$4(i2, { [0]() {
      return null;
    }, [1]() {
      return a$3(__spreadProps(__spreadValues({}, e2), { props: __spreadProps(__spreadValues({}, e2.props), { hidden: true, style: { display: "none" } }) }));
    } });
  }
  return a$3(e2);
}
function a$3({ props: n2, attrs: r2, slots: e2, slot: t2, name: i2 }) {
  var u2;
  let _a2 = R$2(n2, ["unmount", "static"]), { as: p2 } = _a2, s2 = __objRest(_a2, ["as"]), o2 = (u2 = e2.default) == null ? void 0 : u2.call(e2, t2);
  if (p2 === "template") {
    if (Object.keys(s2).length > 0 || Object.keys(r2).length > 0) {
      let [d2, ...c2] = o2 != null ? o2 : [];
      if (!b$3(d2) || c2.length > 0)
        throw new Error(['Passing props on "template"!', "", `The current component <${i2} /> is rendering a "template".`, "However we need to passthrough the following props:", Object.keys(s2).concat(Object.keys(r2)).map((l2) => `  - ${l2}`).join(`
`), "", "You can apply a few solutions:", ['Add an `as="..."` prop, to ensure that we render an actual element instead of a "template".', "Render a single element as the child so that we can forward the props onto that element."].map((l2) => `  - ${l2}`).join(`
`)].join(`
`));
      return vue_cjs_prod.cloneVNode(d2, s2);
    }
    return Array.isArray(o2) && o2.length === 1 ? o2[0] : o2;
  }
  return vue_cjs_prod.h(p2, s2, o2);
}
function O(n2) {
  let r2 = Object.assign({}, n2);
  for (let e2 in r2)
    r2[e2] === void 0 && delete r2[e2];
  return r2;
}
function R$2(n2, r2) {
  let e2 = Object.assign({}, n2);
  for (let t2 of r2)
    t2 in e2 && delete e2[t2];
  return e2;
}
function b$3(n2) {
  return n2 == null ? false : typeof n2.type == "string" || typeof n2.type == "object" || typeof n2.type == "function";
}
let e$3 = 0;
function n$1() {
  return ++e$3;
}
function t$1() {
  return n$1();
}
var o = ((r2) => (r2.Space = " ", r2.Enter = "Enter", r2.Escape = "Escape", r2.Backspace = "Backspace", r2.Delete = "Delete", r2.ArrowLeft = "ArrowLeft", r2.ArrowUp = "ArrowUp", r2.ArrowRight = "ArrowRight", r2.ArrowDown = "ArrowDown", r2.Home = "Home", r2.End = "End", r2.PageUp = "PageUp", r2.PageDown = "PageDown", r2.Tab = "Tab", r2))(o || {});
function f$2(r2) {
  throw new Error("Unexpected object: " + r2);
}
var a$2 = ((e2) => (e2[e2.First = 0] = "First", e2[e2.Previous = 1] = "Previous", e2[e2.Next = 2] = "Next", e2[e2.Last = 3] = "Last", e2[e2.Specific = 4] = "Specific", e2[e2.Nothing = 5] = "Nothing", e2))(a$2 || {});
function x$2(r2, n2) {
  let t2 = n2.resolveItems();
  if (t2.length <= 0)
    return null;
  let l2 = n2.resolveActiveIndex(), s2 = l2 != null ? l2 : -1, d2 = (() => {
    switch (r2.focus) {
      case 0:
        return t2.findIndex((e2) => !n2.resolveDisabled(e2));
      case 1: {
        let e2 = t2.slice().reverse().findIndex((i2, c2, u2) => s2 !== -1 && u2.length - c2 - 1 >= s2 ? false : !n2.resolveDisabled(i2));
        return e2 === -1 ? e2 : t2.length - 1 - e2;
      }
      case 2:
        return t2.findIndex((e2, i2) => i2 <= s2 ? false : !n2.resolveDisabled(e2));
      case 3: {
        let e2 = t2.slice().reverse().findIndex((i2) => !n2.resolveDisabled(i2));
        return e2 === -1 ? e2 : t2.length - 1 - e2;
      }
      case 4:
        return t2.findIndex((e2) => n2.resolveId(e2) === r2.id);
      case 5:
        return null;
      default:
        f$2(r2);
    }
  })();
  return d2 === -1 ? l2 : d2;
}
function t(l2) {
  return l2 == null || l2.value == null ? null : "$el" in l2.value ? l2.value.$el : l2.value;
}
let n = Symbol("Context");
var l$3 = ((e2) => (e2[e2.Open = 0] = "Open", e2[e2.Closed = 1] = "Closed", e2))(l$3 || {});
function f$1() {
  return p$4() !== null;
}
function p$4() {
  return vue_cjs_prod.inject(n, null);
}
function c$3(o2) {
  vue_cjs_prod.provide(n, o2);
}
function r$3(t2, e2) {
  if (t2)
    return t2;
  let n2 = e2 != null ? e2 : "button";
  if (typeof n2 == "string" && n2.toLowerCase() === "button")
    return "button";
}
function b$2(t$12, e2) {
  let n2 = vue_cjs_prod.ref(r$3(t$12.value.type, t$12.value.as));
  return vue_cjs_prod.onMounted(() => {
    n2.value = r$3(t$12.value.type, t$12.value.as);
  }), vue_cjs_prod.watchEffect(() => {
    var o2;
    n2.value || !t(e2) || t(e2) instanceof HTMLButtonElement && !((o2 = t(e2)) != null && o2.hasAttribute("type")) && (n2.value = "button");
  }), n2;
}
function e$2(n2) {
  return null;
}
function p$3({ container: e2, accept: t2, walk: d2, enabled: o2 }) {
  vue_cjs_prod.watchEffect(() => {
    let r2 = e2.value;
    if (!r2 || o2 !== void 0 && !o2.value)
      return;
    return;
  });
}
let c$2 = ["[contentEditable=true]", "[tabindex]", "a[href]", "area[href]", "button:not([disabled])", "iframe", "input:not([disabled])", "select:not([disabled])", "textarea:not([disabled])"].map((e2) => `${e2}:not([tabindex='-1'])`).join(",");
var p$2 = ((n2) => (n2[n2.First = 1] = "First", n2[n2.Previous = 2] = "Previous", n2[n2.Next = 4] = "Next", n2[n2.Last = 8] = "Last", n2[n2.WrapAround = 16] = "WrapAround", n2[n2.NoScroll = 32] = "NoScroll", n2))(p$2 || {}), L$2 = ((o2) => (o2[o2.Error = 0] = "Error", o2[o2.Overflow = 1] = "Overflow", o2[o2.Success = 2] = "Success", o2[o2.Underflow = 3] = "Underflow", o2))(L$2 || {}), N$1 = ((t2) => (t2[t2.Previous = -1] = "Previous", t2[t2.Next = 1] = "Next", t2))(N$1 || {});
function T$3(e2 = document.body) {
  return e2 == null ? [] : Array.from(e2.querySelectorAll(c$2));
}
var b$1 = ((t2) => (t2[t2.Strict = 0] = "Strict", t2[t2.Loose = 1] = "Loose", t2))(b$1 || {});
function F$2(e2) {
  e2 == null || e2.focus({ preventScroll: true });
}
let M = ["textarea", "input"].join(",");
function h$2(e2) {
  var r2, t2;
  return (t2 = (r2 = e2 == null ? void 0 : e2.matches) == null ? void 0 : r2.call(e2, M)) != null ? t2 : false;
}
function v$1(e2, r2 = (t2) => t2) {
  return e2.slice().sort((t2, l2) => {
    let o2 = r2(t2), a2 = r2(l2);
    if (o2 === null || a2 === null)
      return 0;
    let n2 = o2.compareDocumentPosition(a2);
    return n2 & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : n2 & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
  });
}
function H$3(e2, r2) {
  var d2;
  let t2 = (d2 = Array.isArray(e2) ? e2.length > 0 ? e2[0].ownerDocument : document : e2 == null ? void 0 : e2.ownerDocument) != null ? d2 : document, l2 = Array.isArray(e2) ? v$1(e2) : T$3(e2), o2 = t2.activeElement, a2 = (() => {
    if (r2 & 5)
      return 1;
    if (r2 & 10)
      return -1;
    throw new Error("Missing Focus.First, Focus.Previous, Focus.Next or Focus.Last");
  })(), n2 = (() => {
    if (r2 & 1)
      return 0;
    if (r2 & 2)
      return Math.max(0, l2.indexOf(o2)) - 1;
    if (r2 & 4)
      return Math.max(0, l2.indexOf(o2)) + 1;
    if (r2 & 8)
      return l2.length - 1;
    throw new Error("Missing Focus.First, Focus.Previous, Focus.Next or Focus.Last");
  })(), m2 = r2 & 32 ? { preventScroll: true } : {}, f2 = 0, i2 = l2.length, u2;
  do {
    if (f2 >= i2 || f2 + i2 <= 0)
      return 0;
    let s2 = n2 + f2;
    if (r2 & 16)
      s2 = (s2 + i2) % i2;
    else {
      if (s2 < 0)
        return 3;
      if (s2 >= i2)
        return 1;
    }
    u2 = l2[s2], u2 == null || u2.focus(m2), f2 += a2;
  } while (u2 !== t2.activeElement);
  return u2.hasAttribute("tabindex") || u2.setAttribute("tabindex", "0"), r2 & 6 && h$2(u2) && u2.select(), 2;
}
var p$1 = ((n2) => (n2[n2.None = 1] = "None", n2[n2.IgnoreScrollbars = 2] = "IgnoreScrollbars", n2))(p$1 || {});
function g$4(i2, l2, n2) {
}
let l$2 = vue_cjs_prod.defineComponent({ name: "VisuallyHidden", props: { as: { type: [Object, String], default: "div" } }, setup(e2, { slots: r2, attrs: i2 }) {
  return () => k({ props: __spreadValues(__spreadValues({}, e2), { style: { position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", borderWidth: "0", display: "none" } }), slot: {}, attrs: i2, slots: r2, name: "VisuallyHidden" });
} });
function e$1(n2 = {}, r2 = null, t2 = []) {
  for (let [i2, o2] of Object.entries(n2))
    f(t2, s$2(r2, i2), o2);
  return t2;
}
function s$2(n2, r2) {
  return n2 ? n2 + "[" + r2 + "]" : r2;
}
function f(n2, r2, t2) {
  if (Array.isArray(t2))
    for (let [i2, o2] of t2.entries())
      f(n2, s$2(r2, i2.toString()), o2);
  else
    t2 instanceof Date ? n2.push([r2, t2.toISOString()]) : typeof t2 == "boolean" ? n2.push([r2, t2 ? "1" : "0"]) : typeof t2 == "string" ? n2.push([r2, t2]) : typeof t2 == "number" ? n2.push([r2, `${t2}`]) : t2 == null ? n2.push([r2, ""]) : e$1(t2, r2, n2);
}
function p(n2) {
  var t2;
  let r2 = (t2 = n2 == null ? void 0 : n2.form) != null ? t2 : n2.closest("form");
  if (!!r2) {
    for (let i2 of r2.elements)
      if (i2.tagName === "INPUT" && i2.type === "submit" || i2.tagName === "BUTTON" && i2.type === "submit" || i2.nodeName === "INPUT" && i2.type === "image") {
        i2.click();
        return;
      }
  }
}
var ue$3 = ((a2) => (a2[a2.Open = 0] = "Open", a2[a2.Closed = 1] = "Closed", a2))(ue$3 || {}), re = ((a2) => (a2[a2.Single = 0] = "Single", a2[a2.Multi = 1] = "Multi", a2))(re || {}), se$1 = ((a2) => (a2[a2.Pointer = 0] = "Pointer", a2[a2.Other = 1] = "Other", a2))(se$1 || {});
let _$1 = Symbol("ComboboxContext");
function A$1(n2) {
  let O2 = vue_cjs_prod.inject(_$1, null);
  if (O2 === null) {
    let a2 = new Error(`<${n2} /> is missing a parent <Combobox /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(a2, A$1), a2;
  }
  return O2;
}
let we$2 = vue_cjs_prod.defineComponent({ name: "Combobox", emits: { "update:modelValue": (n2) => true }, props: { as: { type: [Object, String], default: "template" }, disabled: { type: [Boolean], default: false }, modelValue: { type: [Object, String, Number, Boolean] }, name: { type: String }, nullable: { type: Boolean, default: false }, multiple: { type: [Boolean], default: false } }, inheritAttrs: false, setup(n2, { slots: O$1, attrs: a2, emit: C2 }) {
  let e2 = vue_cjs_prod.ref(1), t$12 = vue_cjs_prod.ref(null), d2 = vue_cjs_prod.ref(null), S2 = vue_cjs_prod.ref(null), c2 = vue_cjs_prod.ref(null), b2 = vue_cjs_prod.ref({ static: false, hold: false }), o2 = vue_cjs_prod.ref([]), p2 = vue_cjs_prod.ref(null), v2 = vue_cjs_prod.ref(1), h2 = vue_cjs_prod.ref(false);
  function f2(i2 = (s2) => s2) {
    let s2 = p2.value !== null ? o2.value[p2.value] : null, u2 = v$1(i2(o2.value.slice()), (m2) => t(m2.dataRef.domRef)), l2 = s2 ? u2.indexOf(s2) : null;
    return l2 === -1 && (l2 = null), { options: u2, activeOptionIndex: l2 };
  }
  let P2 = vue_cjs_prod.computed(() => n2.modelValue), w2 = vue_cjs_prod.computed(() => n2.multiple ? 1 : 0), L2 = vue_cjs_prod.computed(() => n2.nullable), r2 = { comboboxState: e2, value: P2, mode: w2, nullable: L2, inputRef: d2, labelRef: t$12, buttonRef: S2, optionsRef: c2, disabled: vue_cjs_prod.computed(() => n2.disabled), options: o2, change(i2) {
    C2("update:modelValue", i2);
  }, activeOptionIndex: vue_cjs_prod.computed(() => {
    if (h2.value && p2.value === null && o2.value.length > 0) {
      let i2 = o2.value.findIndex((s2) => !s2.dataRef.disabled);
      if (i2 !== -1)
        return i2;
    }
    return p2.value;
  }), activationTrigger: v2, inputPropsRef: vue_cjs_prod.ref({ displayValue: void 0 }), optionsPropsRef: b2, closeCombobox() {
    h2.value = false, !n2.disabled && e2.value !== 1 && (e2.value = 1, p2.value = null);
  }, openCombobox() {
    if (h2.value = true, n2.disabled || e2.value === 0)
      return;
    let i2 = o2.value.findIndex((s2) => {
      let u2 = vue_cjs_prod.toRaw(s2.dataRef.value);
      return u$4(w2.value, { [0]: () => vue_cjs_prod.toRaw(r2.value.value) === vue_cjs_prod.toRaw(u2), [1]: () => vue_cjs_prod.toRaw(r2.value.value).includes(vue_cjs_prod.toRaw(u2)) });
    });
    i2 !== -1 && (p2.value = i2), e2.value = 0;
  }, goToOption(i2, s2, u2) {
    if (h2.value = false, n2.disabled || c2.value && !b2.value.static && e2.value === 1)
      return;
    let l2 = f2();
    if (l2.activeOptionIndex === null) {
      let T2 = l2.options.findIndex((j) => !j.dataRef.disabled);
      T2 !== -1 && (l2.activeOptionIndex = T2);
    }
    let m2 = x$2(i2 === a$2.Specific ? { focus: a$2.Specific, id: s2 } : { focus: i2 }, { resolveItems: () => l2.options, resolveActiveIndex: () => l2.activeOptionIndex, resolveId: (T2) => T2.id, resolveDisabled: (T2) => T2.dataRef.disabled });
    p2.value = m2, v2.value = u2 != null ? u2 : 1, o2.value = l2.options;
  }, syncInputValue() {
    var u2;
    let i2 = r2.value.value;
    if (!t(r2.inputRef))
      return;
    let s2 = r2.inputPropsRef.value.displayValue;
    typeof s2 == "function" ? r2.inputRef.value.value = (u2 = s2(i2)) != null ? u2 : "" : typeof i2 == "string" ? r2.inputRef.value.value = i2 : r2.inputRef.value.value = "";
  }, selectOption(i2) {
    let s2 = o2.value.find((l2) => l2.id === i2);
    if (!s2)
      return;
    let { dataRef: u2 } = s2;
    C2("update:modelValue", u$4(w2.value, { [0]: () => u2.value, [1]: () => {
      let l2 = vue_cjs_prod.toRaw(r2.value.value).slice(), m2 = vue_cjs_prod.toRaw(u2.value), T2 = l2.indexOf(m2);
      return T2 === -1 ? l2.push(m2) : l2.splice(T2, 1), l2;
    } })), r2.syncInputValue();
  }, selectActiveOption() {
    if (r2.activeOptionIndex.value === null)
      return;
    let { dataRef: i2, id: s2 } = o2.value[r2.activeOptionIndex.value];
    C2("update:modelValue", u$4(w2.value, { [0]: () => i2.value, [1]: () => {
      let u2 = vue_cjs_prod.toRaw(r2.value.value).slice(), l2 = vue_cjs_prod.toRaw(i2.value), m2 = u2.indexOf(l2);
      return m2 === -1 ? u2.push(l2) : u2.splice(m2, 1), u2;
    } })), r2.syncInputValue(), r2.goToOption(a$2.Specific, s2);
  }, registerOption(i2, s2) {
    let u2 = { id: i2, dataRef: s2 }, l2 = f2((m2) => [...m2, u2]);
    if (p2.value === null) {
      let m2 = s2.value.value;
      u$4(w2.value, { [0]: () => vue_cjs_prod.toRaw(r2.value.value) === vue_cjs_prod.toRaw(m2), [1]: () => vue_cjs_prod.toRaw(r2.value.value).includes(vue_cjs_prod.toRaw(m2)) }) && (l2.activeOptionIndex = l2.options.indexOf(u2));
    }
    o2.value = l2.options, p2.value = l2.activeOptionIndex, v2.value = 1;
  }, unregisterOption(i2) {
    let s2 = f2((u2) => {
      let l2 = u2.findIndex((m2) => m2.id === i2);
      return l2 !== -1 && u2.splice(l2, 1), u2;
    });
    o2.value = s2.options, p2.value = s2.activeOptionIndex, v2.value = 1;
  } };
  vue_cjs_prod.watch([r2.value, r2.inputRef], () => r2.syncInputValue(), { immediate: true }), vue_cjs_prod.watch(r2.comboboxState, (i2) => {
    i2 === 1 && r2.syncInputValue();
  }, { immediate: true }), vue_cjs_prod.provide(_$1, r2), c$3(vue_cjs_prod.computed(() => u$4(e2.value, { [0]: l$3.Open, [1]: l$3.Closed })));
  let q = vue_cjs_prod.computed(() => r2.activeOptionIndex.value === null ? null : o2.value[r2.activeOptionIndex.value].dataRef.value);
  return () => {
    let _a2 = n2, { name: i2, modelValue: s2, disabled: u2 } = _a2, l2 = __objRest(_a2, ["name", "modelValue", "disabled"]), m2 = { open: e2.value === 0, disabled: u2, activeIndex: r2.activeOptionIndex.value, activeOption: q.value };
    return vue_cjs_prod.h(vue_cjs_prod.Fragment, [...i2 != null && s2 != null ? e$1({ [i2]: s2 }).map(([T2, j]) => vue_cjs_prod.h(l$2, O({ key: T2, as: "input", type: "hidden", hidden: true, readOnly: true, name: T2, value: j }))) : [], k({ props: __spreadValues(__spreadValues({}, a2), R$2(l2, ["nullable", "multiple", "onUpdate:modelValue"])), slot: m2, slots: O$1, attrs: a2, name: "Combobox" })]);
  };
} }), Me$1 = vue_cjs_prod.defineComponent({ name: "ComboboxLabel", props: { as: { type: [Object, String], default: "label" } }, setup(n2, { attrs: O2, slots: a2 }) {
  let C2 = A$1("ComboboxLabel"), e2 = `headlessui-combobox-label-${t$1()}`;
  function t$2() {
    var d2;
    (d2 = t(C2.inputRef)) == null || d2.focus({ preventScroll: true });
  }
  return () => {
    let d2 = { open: C2.comboboxState.value === 0, disabled: C2.disabled.value }, S2 = { id: e2, ref: C2.labelRef, onClick: t$2 };
    return k({ props: __spreadValues(__spreadValues({}, n2), S2), slot: d2, attrs: O2, slots: a2, name: "ComboboxLabel" });
  };
} }), Ve = vue_cjs_prod.defineComponent({ name: "ComboboxButton", props: { as: { type: [Object, String], default: "button" } }, setup(n2, { attrs: O2, slots: a2, expose: C2 }) {
  let e2 = A$1("ComboboxButton"), t$2 = `headlessui-combobox-button-${t$1()}`;
  C2({ el: e2.buttonRef, $el: e2.buttonRef });
  function d2(b2) {
    e2.disabled.value || (e2.comboboxState.value === 0 ? e2.closeCombobox() : (b2.preventDefault(), e2.openCombobox()), vue_cjs_prod.nextTick(() => {
      var o2;
      return (o2 = t(e2.inputRef)) == null ? void 0 : o2.focus({ preventScroll: true });
    }));
  }
  function S2(b2) {
    switch (b2.key) {
      case o.ArrowDown:
        b2.preventDefault(), b2.stopPropagation(), e2.comboboxState.value === 1 && (e2.openCombobox(), vue_cjs_prod.nextTick(() => {
          e2.value.value || e2.goToOption(a$2.First);
        })), vue_cjs_prod.nextTick(() => {
          var o2;
          return (o2 = e2.inputRef.value) == null ? void 0 : o2.focus({ preventScroll: true });
        });
        return;
      case o.ArrowUp:
        b2.preventDefault(), b2.stopPropagation(), e2.comboboxState.value === 1 && (e2.openCombobox(), vue_cjs_prod.nextTick(() => {
          e2.value.value || e2.goToOption(a$2.Last);
        })), vue_cjs_prod.nextTick(() => {
          var o2;
          return (o2 = e2.inputRef.value) == null ? void 0 : o2.focus({ preventScroll: true });
        });
        return;
      case o.Escape:
        b2.preventDefault(), e2.optionsRef.value && !e2.optionsPropsRef.value.static && b2.stopPropagation(), e2.closeCombobox(), vue_cjs_prod.nextTick(() => {
          var o2;
          return (o2 = e2.inputRef.value) == null ? void 0 : o2.focus({ preventScroll: true });
        });
        return;
    }
  }
  let c2 = b$2(vue_cjs_prod.computed(() => ({ as: n2.as, type: O2.type })), e2.buttonRef);
  return () => {
    var p2, v2;
    let b2 = { open: e2.comboboxState.value === 0, disabled: e2.disabled.value }, o2 = { ref: e2.buttonRef, id: t$2, type: c2.value, tabindex: "-1", "aria-haspopup": true, "aria-controls": (p2 = t(e2.optionsRef)) == null ? void 0 : p2.id, "aria-expanded": e2.disabled.value ? void 0 : e2.comboboxState.value === 0, "aria-labelledby": e2.labelRef.value ? [(v2 = t(e2.labelRef)) == null ? void 0 : v2.id, t$2].join(" ") : void 0, disabled: e2.disabled.value === true ? true : void 0, onKeydown: S2, onClick: d2 };
    return k({ props: __spreadValues(__spreadValues({}, n2), o2), slot: b2, attrs: O2, slots: a2, name: "ComboboxButton" });
  };
} }), ke$1 = vue_cjs_prod.defineComponent({ name: "ComboboxInput", props: { as: { type: [Object, String], default: "input" }, static: { type: Boolean, default: false }, unmount: { type: Boolean, default: true }, displayValue: { type: Function } }, emits: { change: (n2) => true }, setup(n2, { emit: O2, attrs: a2, slots: C2, expose: e2 }) {
  let t$2 = A$1("ComboboxInput"), d2 = `headlessui-combobox-input-${t$1()}`;
  t$2.inputPropsRef = vue_cjs_prod.computed(() => n2), e2({ el: t$2.inputRef, $el: t$2.inputRef });
  function S2(o$1) {
    switch (o$1.key) {
      case o.Backspace:
      case o.Delete:
        if (t$2.mode.value !== 0 || !t$2.nullable.value)
          return;
        let p2 = o$1.currentTarget;
        requestAnimationFrame(() => {
          if (p2.value === "") {
            t$2.change(null);
            let v2 = t(t$2.optionsRef);
            v2 && (v2.scrollTop = 0), t$2.goToOption(a$2.Nothing);
          }
        });
        break;
      case o.Enter:
        if (t$2.comboboxState.value !== 0)
          return;
        if (o$1.preventDefault(), o$1.stopPropagation(), t$2.activeOptionIndex.value === null) {
          t$2.closeCombobox();
          return;
        }
        t$2.selectActiveOption(), t$2.mode.value === 0 && t$2.closeCombobox();
        break;
      case o.ArrowDown:
        return o$1.preventDefault(), o$1.stopPropagation(), u$4(t$2.comboboxState.value, { [0]: () => t$2.goToOption(a$2.Next), [1]: () => {
          t$2.openCombobox(), vue_cjs_prod.nextTick(() => {
            t$2.value.value || t$2.goToOption(a$2.First);
          });
        } });
      case o.ArrowUp:
        return o$1.preventDefault(), o$1.stopPropagation(), u$4(t$2.comboboxState.value, { [0]: () => t$2.goToOption(a$2.Previous), [1]: () => {
          t$2.openCombobox(), vue_cjs_prod.nextTick(() => {
            t$2.value.value || t$2.goToOption(a$2.Last);
          });
        } });
      case o.Home:
      case o.PageUp:
        return o$1.preventDefault(), o$1.stopPropagation(), t$2.goToOption(a$2.First);
      case o.End:
      case o.PageDown:
        return o$1.preventDefault(), o$1.stopPropagation(), t$2.goToOption(a$2.Last);
      case o.Escape:
        o$1.preventDefault(), t$2.optionsRef.value && !t$2.optionsPropsRef.value.static && o$1.stopPropagation(), t$2.closeCombobox();
        break;
      case o.Tab:
        t$2.selectActiveOption(), t$2.closeCombobox();
        break;
    }
  }
  function c2(o2) {
    O2("change", o2);
  }
  function b2(o2) {
    t$2.openCombobox(), O2("change", o2);
  }
  return () => {
    var h2, f2, P2, w2, L2;
    let o2 = { open: t$2.comboboxState.value === 0 }, p2 = { "aria-controls": (h2 = t$2.optionsRef.value) == null ? void 0 : h2.id, "aria-expanded": t$2.disabled ? void 0 : t$2.comboboxState.value === 0, "aria-activedescendant": t$2.activeOptionIndex.value === null || (f2 = t$2.options.value[t$2.activeOptionIndex.value]) == null ? void 0 : f2.id, "aria-multiselectable": t$2.mode.value === 1 ? true : void 0, "aria-labelledby": (L2 = (P2 = t(t$2.labelRef)) == null ? void 0 : P2.id) != null ? L2 : (w2 = t(t$2.buttonRef)) == null ? void 0 : w2.id, id: d2, onKeydown: S2, onChange: c2, onInput: b2, role: "combobox", type: "text", tabIndex: 0, ref: t$2.inputRef }, v2 = R$2(n2, ["displayValue"]);
    return k({ props: __spreadValues(__spreadValues({}, v2), p2), slot: o2, attrs: a2, slots: C2, features: m$1.RenderStrategy | m$1.Static, name: "ComboboxInput" });
  };
} }), Ee = vue_cjs_prod.defineComponent({ name: "ComboboxOptions", props: { as: { type: [Object, String], default: "ul" }, static: { type: Boolean, default: false }, unmount: { type: Boolean, default: true }, hold: { type: [Boolean], default: false } }, setup(n2, { attrs: O2, slots: a2, expose: C2 }) {
  let e2 = A$1("ComboboxOptions"), t$2 = `headlessui-combobox-options-${t$1()}`;
  C2({ el: e2.optionsRef, $el: e2.optionsRef }), vue_cjs_prod.watchEffect(() => {
    e2.optionsPropsRef.value.static = n2.static;
  }), vue_cjs_prod.watchEffect(() => {
    e2.optionsPropsRef.value.hold = n2.hold;
  });
  let d2 = p$4(), S2 = vue_cjs_prod.computed(() => d2 !== null ? d2.value === l$3.Open : e2.comboboxState.value === 0);
  return p$3({ container: vue_cjs_prod.computed(() => t(e2.optionsRef)), enabled: vue_cjs_prod.computed(() => e2.comboboxState.value === 0), accept(c2) {
    return c2.getAttribute("role") === "option" ? NodeFilter.FILTER_REJECT : c2.hasAttribute("role") ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT;
  }, walk(c2) {
    c2.setAttribute("role", "none");
  } }), () => {
    var p2, v2, h2, f2;
    let c2 = { open: e2.comboboxState.value === 0 }, b2 = { "aria-activedescendant": e2.activeOptionIndex.value === null || (p2 = e2.options.value[e2.activeOptionIndex.value]) == null ? void 0 : p2.id, "aria-labelledby": (f2 = (v2 = t(e2.labelRef)) == null ? void 0 : v2.id) != null ? f2 : (h2 = t(e2.buttonRef)) == null ? void 0 : h2.id, id: t$2, ref: e2.optionsRef, role: "listbox" }, o2 = R$2(n2, ["hold"]);
    return k({ props: __spreadValues(__spreadValues({}, o2), b2), slot: c2, attrs: O2, slots: a2, features: m$1.RenderStrategy | m$1.Static, visible: S2.value, name: "ComboboxOptions" });
  };
} }), Ae$1 = vue_cjs_prod.defineComponent({ name: "ComboboxOption", props: { as: { type: [Object, String], default: "li" }, value: { type: [Object, String, Number, Boolean] }, disabled: { type: Boolean, default: false } }, setup(n2, { slots: O2, attrs: a2, expose: C2 }) {
  let e2 = A$1("ComboboxOption"), t$2 = `headlessui-combobox-option-${t$1()}`, d2 = vue_cjs_prod.ref(null);
  C2({ el: d2, $el: d2 });
  let S2 = vue_cjs_prod.computed(() => e2.activeOptionIndex.value !== null ? e2.options.value[e2.activeOptionIndex.value].id === t$2 : false), c2 = vue_cjs_prod.computed(() => u$4(e2.mode.value, { [0]: () => vue_cjs_prod.toRaw(e2.value.value) === vue_cjs_prod.toRaw(n2.value), [1]: () => vue_cjs_prod.toRaw(e2.value.value).includes(vue_cjs_prod.toRaw(n2.value)) })), b2 = vue_cjs_prod.computed(() => ({ disabled: n2.disabled, value: n2.value, domRef: d2 }));
  vue_cjs_prod.onMounted(() => e2.registerOption(t$2, b2)), vue_cjs_prod.onUnmounted(() => e2.unregisterOption(t$2)), vue_cjs_prod.watchEffect(() => {
    e2.comboboxState.value === 0 && (!S2.value || e2.activationTrigger.value !== 0 && vue_cjs_prod.nextTick(() => {
      var f2, P2;
      return (P2 = (f2 = t(d2)) == null ? void 0 : f2.scrollIntoView) == null ? void 0 : P2.call(f2, { block: "nearest" });
    }));
  });
  function o2(f2) {
    if (n2.disabled)
      return f2.preventDefault();
    e2.selectOption(t$2), e2.mode.value === 0 && (e2.closeCombobox(), vue_cjs_prod.nextTick(() => {
      var P2;
      return (P2 = t(e2.inputRef)) == null ? void 0 : P2.focus({ preventScroll: true });
    }));
  }
  function p2() {
    if (n2.disabled)
      return e2.goToOption(a$2.Nothing);
    e2.goToOption(a$2.Specific, t$2);
  }
  function v2() {
    n2.disabled || S2.value || e2.goToOption(a$2.Specific, t$2, 0);
  }
  function h2() {
    n2.disabled || !S2.value || e2.optionsPropsRef.value.hold || e2.goToOption(a$2.Nothing);
  }
  return () => {
    let { disabled: f2 } = n2, P2 = { active: S2.value, selected: c2.value, disabled: f2 }, w2 = { id: t$2, ref: d2, role: "option", tabIndex: f2 === true ? void 0 : -1, "aria-disabled": f2 === true ? true : void 0, "aria-selected": c2.value === true ? c2.value : void 0, disabled: void 0, onClick: o2, onFocus: p2, onPointermove: v2, onMousemove: v2, onPointerleave: h2, onMouseleave: h2 };
    return k({ props: __spreadValues(__spreadValues({}, n2), w2), slot: P2, attrs: a2, slots: O2, name: "ComboboxOption" });
  };
} });
const combobox = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Combobox: we$2,
  ComboboxButton: Ve,
  ComboboxInput: ke$1,
  ComboboxLabel: Me$1,
  ComboboxOption: Ae$1,
  ComboboxOptions: Ee
}, Symbol.toStringTag, { value: "Module" }));
let u$3 = Symbol("DescriptionContext");
function h$1() {
  let n2 = vue_cjs_prod.inject(u$3, null);
  if (n2 === null)
    throw new Error("Missing parent");
  return n2;
}
function P$4({ slot: n2 = vue_cjs_prod.ref({}), name: o2 = "Description", props: s2 = {} } = {}) {
  let e2 = vue_cjs_prod.ref([]);
  function t2(r2) {
    return e2.value.push(r2), () => {
      let i2 = e2.value.indexOf(r2);
      i2 !== -1 && e2.value.splice(i2, 1);
    };
  }
  return vue_cjs_prod.provide(u$3, { register: t2, slot: n2, name: o2, props: s2 }), vue_cjs_prod.computed(() => e2.value.length > 0 ? e2.value.join(" ") : void 0);
}
let S = vue_cjs_prod.defineComponent({ name: "Description", props: { as: { type: [Object, String], default: "p" } }, setup(n2, { attrs: o2, slots: s2 }) {
  let e2 = h$1(), t2 = `headlessui-description-${t$1()}`;
  return vue_cjs_prod.onMounted(() => vue_cjs_prod.onUnmounted(e2.register(t2))), () => {
    let { name: r2 = "Description", slot: i2 = vue_cjs_prod.ref({}), props: c2 = {} } = e2, l2 = n2, d2 = __spreadProps(__spreadValues({}, Object.entries(c2).reduce((f2, [a2, g2]) => Object.assign(f2, { [a2]: vue_cjs_prod.unref(g2) }), {})), { id: t2 });
    return k({ props: __spreadValues(__spreadValues({}, l2), d2), slot: i2.value, attrs: o2, slots: s2, name: r2 });
  };
} });
const description = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Description: S,
  useDescriptions: P$4
}, Symbol.toStringTag, { value: "Module" }));
function r$2(n2, e2, d2, o2) {
}
var g$3 = ((e2) => (e2[e2.None = 1] = "None", e2[e2.InitialFocus = 2] = "InitialFocus", e2[e2.TabLock = 4] = "TabLock", e2[e2.FocusLock = 8] = "FocusLock", e2[e2.RestoreFocus = 16] = "RestoreFocus", e2[e2.All = 30] = "All", e2))(g$3 || {});
function W$2(r2, f2 = vue_cjs_prod.ref(30), i2 = vue_cjs_prod.ref({})) {
  var H2, R2;
  let a2 = vue_cjs_prod.ref(null), o$1 = vue_cjs_prod.ref(null), v2 = { value: false }, e2 = vue_cjs_prod.computed(() => Boolean(f2.value & 16)), M2 = vue_cjs_prod.computed(() => Boolean(f2.value & 2)), s2 = vue_cjs_prod.computed(() => e$2());
  return vue_cjs_prod.onMounted(() => {
    vue_cjs_prod.watch(e2, (t2, l2) => {
      var u2;
      t2 !== l2 && (!e2.value || (v2.value = true, a2.value || (a2.value = (u2 = s2.value) == null ? void 0 : u2.activeElement)));
    }, { immediate: true }), vue_cjs_prod.watch(e2, (t2, l2, u2) => {
      t2 !== l2 && (!e2.value || u2(() => {
        v2.value !== false && (v2.value = false, F$2(a2.value), a2.value = null);
      }));
    }, { immediate: true }), vue_cjs_prod.watch([r2, i2, i2.value.initialFocus, M2], (t$12, l2) => {
      var p2, F2;
      if (t$12.every((b2, h2) => (l2 == null ? void 0 : l2[h2]) === b2) || !M2.value)
        return;
      let u2 = r2.value;
      if (!u2)
        return;
      let n2 = t(i2.value.initialFocus), m2 = (p2 = s2.value) == null ? void 0 : p2.activeElement;
      if (n2) {
        if (n2 === m2) {
          o$1.value = m2;
          return;
        }
      } else if (u2.contains(m2)) {
        o$1.value = m2;
        return;
      }
      n2 ? F$2(n2) : H$3(u2, p$2.First) === L$2.Error && console.warn("There are no focusable elements inside the <FocusTrap />"), o$1.value = (F2 = s2.value) == null ? void 0 : F2.activeElement;
    }, { immediate: true });
  }), r$2((H2 = s2.value) == null ? void 0 : H2.defaultView), r$2((R2 = s2.value) == null ? void 0 : R2.defaultView), a2;
}
function g$2(t2, n2 = vue_cjs_prod.ref(true)) {
  vue_cjs_prod.watchEffect((d2) => {
    if (!n2.value || !t2.value)
      return;
    t2.value;
  });
}
let e = Symbol("ForcePortalRootContext");
function u$1() {
  return vue_cjs_prod.inject(e, false);
}
let P$3 = vue_cjs_prod.defineComponent({ name: "ForcePortalRoot", props: { as: { type: [Object, String], default: "template" }, force: { type: Boolean, default: false } }, setup(o2, { slots: t2, attrs: r2 }) {
  return vue_cjs_prod.provide(e, o2.force), () => {
    let _a2 = o2, n2 = __objRest(_a2, ["force"]);
    return k({ props: n2, slot: {}, slots: t2, attrs: r2, name: "ForcePortalRoot" });
  };
} });
function v(r2) {
  throw new Error(`[Headless UI]: Cannot find ownerDocument for contextElement: ${r2}`);
}
let R$1 = vue_cjs_prod.defineComponent({ name: "Portal", props: { as: { type: [Object, String], default: "div" } }, setup(r2, { slots: t2, attrs: l2 }) {
  let e2 = vue_cjs_prod.ref(null), p2 = vue_cjs_prod.computed(() => e$2()), n2 = u$1(), u2 = vue_cjs_prod.inject(g$1, null), o2 = vue_cjs_prod.ref(n2 === true || u2 == null ? v(e2.value) : u2.resolveTarget());
  return vue_cjs_prod.watchEffect(() => {
    n2 || u2 != null && (o2.value = u2.resolveTarget());
  }), vue_cjs_prod.onUnmounted(() => {
    var i2, m2;
    let a2 = (i2 = p2.value) == null ? void 0 : i2.getElementById("headlessui-portal-root");
    !a2 || o2.value === a2 && o2.value.children.length <= 0 && ((m2 = o2.value.parentElement) == null || m2.removeChild(o2.value));
  }), () => {
    if (o2.value === null)
      return null;
    let a2 = { ref: e2 };
    return vue_cjs_prod.h(vue_cjs_prod.Teleport, { to: o2.value }, k({ props: __spreadValues(__spreadValues({}, r2), a2), slot: {}, attrs: l2, slots: t2, name: "Portal" }));
  };
} }), g$1 = Symbol("PortalGroupContext"), L$1 = vue_cjs_prod.defineComponent({ name: "PortalGroup", props: { as: { type: [Object, String], default: "template" }, target: { type: Object, default: null } }, setup(r2, { attrs: t2, slots: l2 }) {
  let e2 = vue_cjs_prod.reactive({ resolveTarget() {
    return r2.target;
  } });
  return vue_cjs_prod.provide(g$1, e2), () => {
    let _a2 = r2, n2 = __objRest(_a2, ["target"]);
    return k({ props: n2, slot: {}, attrs: t2, slots: l2, name: "PortalGroup" });
  };
} });
const portal = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Portal: R$1,
  PortalGroup: L$1
}, Symbol.toStringTag, { value: "Module" }));
let i = Symbol("StackContext");
var c$1 = ((e2) => (e2[e2.Add = 0] = "Add", e2[e2.Remove = 1] = "Remove", e2))(c$1 || {});
function a$1() {
  return vue_cjs_prod.inject(i, () => {
  });
}
function s({ type: n2, element: o2, onUpdate: e2 }) {
  let m2 = a$1();
  function t2(...r2) {
    e2 == null || e2(...r2), m2(...r2);
  }
  vue_cjs_prod.onMounted(() => {
    t2(0, n2, o2), vue_cjs_prod.onUnmounted(() => {
      t2(1, n2, o2);
    });
  }), vue_cjs_prod.provide(i, t2);
}
var fe$2 = ((e2) => (e2[e2.Open = 0] = "Open", e2[e2.Closed = 1] = "Closed", e2))(fe$2 || {});
let x$1 = Symbol("DialogContext");
function P$2(o2) {
  let r2 = vue_cjs_prod.inject(x$1, null);
  if (r2 === null) {
    let e2 = new Error(`<${o2} /> is missing a parent <Dialog /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(e2, P$2), e2;
  }
  return r2;
}
let T$2 = "DC8F892D-2EBD-447C-A4C8-A03058436FF4", Me = vue_cjs_prod.defineComponent({ name: "Dialog", inheritAttrs: false, props: { as: { type: [Object, String], default: "div" }, static: { type: Boolean, default: false }, unmount: { type: Boolean, default: true }, open: { type: [Boolean, String], default: T$2 }, initialFocus: { type: Object, default: null } }, emits: { close: (o2) => true }, setup(o$1, { emit: r2, attrs: e2, slots: i2, expose: s$12 }) {
  var M2;
  let p2 = vue_cjs_prod.ref(0), a2 = p$4(), m2 = vue_cjs_prod.computed(() => o$1.open === T$2 && a2 !== null ? u$4(a2.value, { [l$3.Open]: true, [l$3.Closed]: false }) : o$1.open), S2 = vue_cjs_prod.ref(/* @__PURE__ */ new Set()), d2 = vue_cjs_prod.ref(null), k$1 = vue_cjs_prod.computed(() => e$2());
  if (s$12({ el: d2, $el: d2 }), !(o$1.open !== T$2 || a2 !== null))
    throw new Error("You forgot to provide an `open` prop to the `Dialog`.");
  if (typeof m2.value != "boolean")
    throw new Error(`You provided an \`open\` prop to the \`Dialog\`, but the value is not a boolean. Received: ${m2.value === T$2 ? void 0 : o$1.open}`);
  let c2 = vue_cjs_prod.computed(() => m2.value ? 0 : 1), I2 = vue_cjs_prod.computed(() => c2.value === 0), R2 = vue_cjs_prod.computed(() => p2.value > 1), _2 = vue_cjs_prod.inject(x$1, null) !== null, N2 = vue_cjs_prod.computed(() => R2.value ? "parent" : "leaf"), U = W$2(d2, vue_cjs_prod.computed(() => I2.value ? u$4(N2.value, { parent: g$3.RestoreFocus, leaf: g$3.All & ~g$3.FocusLock }) : g$3.None), vue_cjs_prod.computed(() => ({ initialFocus: vue_cjs_prod.ref(o$1.initialFocus), containers: S2 })));
  g$2(d2, vue_cjs_prod.computed(() => R2.value ? I2.value : false)), s({ type: "Dialog", element: d2, onUpdate: (t2, l2, n2) => {
    if (l2 === "Dialog")
      return u$4(t2, { [c$1.Add]() {
        S2.value.add(n2), p2.value += 1;
      }, [c$1.Remove]() {
        S2.value.delete(n2), p2.value -= 1;
      } });
  } });
  let V = P$4({ name: "DialogDescription", slot: vue_cjs_prod.computed(() => ({ open: m2.value })) }), Y2 = `headlessui-dialog-${t$1()}`, C2 = vue_cjs_prod.ref(null), v2 = { titleId: C2, panelRef: vue_cjs_prod.ref(null), dialogState: c2, setTitleId(t2) {
    C2.value !== t2 && (C2.value = t2);
  }, close() {
    r2("close", false);
  } };
  vue_cjs_prod.provide(x$1, v2), g$4(() => {
    var l2, n2, g2;
    return [...Array.from((n2 = (l2 = k$1.value) == null ? void 0 : l2.querySelectorAll("body > *")) != null ? n2 : []).filter((u2) => !(!(u2 instanceof HTMLElement) || u2.contains(U.value) || v2.panelRef.value && u2.contains(v2.panelRef.value))), (g2 = v2.panelRef.value) != null ? g2 : d2.value];
  }, (t2, l2) => {
    c2.value === 0 && (R2.value || (v2.close(), vue_cjs_prod.nextTick(() => l2 == null ? void 0 : l2.focus())));
  }, p$1.IgnoreScrollbars), r$2((M2 = k$1.value) == null ? void 0 : M2.defaultView), vue_cjs_prod.watchEffect((t2) => {
    var B2;
    if (c2.value !== 0 || _2)
      return;
    let l2 = k$1.value;
    if (!l2)
      return;
    let n2 = l2 == null ? void 0 : l2.documentElement, g2 = (B2 = l2.defaultView) != null ? B2 : window, u2 = n2.style.overflow, G2 = n2.style.paddingRight, z2 = g2.innerWidth - n2.clientWidth;
    n2.style.overflow = "hidden", n2.style.paddingRight = `${z2}px`, t2(() => {
      n2.style.overflow = u2, n2.style.paddingRight = G2;
    });
  }), vue_cjs_prod.watchEffect((t$12) => {
    if (c2.value !== 0)
      return;
    let l2 = t(d2);
    if (!l2)
      return;
    let n2 = new IntersectionObserver((g2) => {
      for (let u2 of g2)
        u2.boundingClientRect.x === 0 && u2.boundingClientRect.y === 0 && u2.boundingClientRect.width === 0 && u2.boundingClientRect.height === 0 && v2.close();
    });
    n2.observe(l2), t$12(() => n2.disconnect());
  });
  function q(t2) {
    t2.stopPropagation();
  }
  return () => {
    let t2 = __spreadProps(__spreadValues({}, e2), { ref: d2, id: Y2, role: "dialog", "aria-modal": c2.value === 0 ? true : void 0, "aria-labelledby": C2.value, "aria-describedby": V.value, onClick: q }), _a2 = o$1, g2 = __objRest(_a2, ["open", "initialFocus"]), u2 = { open: c2.value === 0 };
    return vue_cjs_prod.h(P$3, { force: true }, () => vue_cjs_prod.h(R$1, () => vue_cjs_prod.h(L$1, { target: d2.value }, () => vue_cjs_prod.h(P$3, { force: false }, () => k({ props: __spreadValues(__spreadValues({}, g2), t2), slot: u2, attrs: e2, slots: i2, visible: c2.value === 0, features: m$1.RenderStrategy | m$1.Static, name: "Dialog" })))));
  };
} }), Be = vue_cjs_prod.defineComponent({ name: "DialogOverlay", props: { as: { type: [Object, String], default: "div" } }, setup(o2, { attrs: r2, slots: e2 }) {
  let i2 = P$2("DialogOverlay"), s2 = `headlessui-dialog-overlay-${t$1()}`;
  function p2(a2) {
    a2.target === a2.currentTarget && (a2.preventDefault(), a2.stopPropagation(), i2.close());
  }
  return () => k({ props: __spreadValues(__spreadValues({}, o2), { id: s2, "aria-hidden": true, onClick: p2 }), slot: { open: i2.dialogState.value === 0 }, attrs: r2, slots: e2, name: "DialogOverlay" });
} }), $e = vue_cjs_prod.defineComponent({ name: "DialogBackdrop", props: { as: { type: [Object, String], default: "div" } }, inheritAttrs: false, setup(o2, { attrs: r2, slots: e2, expose: i2 }) {
  let s2 = P$2("DialogBackdrop"), p2 = `headlessui-dialog-backdrop-${t$1()}`, a2 = vue_cjs_prod.ref(null);
  return i2({ el: a2, $el: a2 }), vue_cjs_prod.onMounted(() => {
    if (s2.panelRef.value === null)
      throw new Error("A <DialogBackdrop /> component is being used, but a <DialogPanel /> component is missing.");
  }), () => {
    let m2 = o2, S2 = { id: p2, ref: a2, "aria-hidden": true };
    return vue_cjs_prod.h(P$3, { force: true }, () => vue_cjs_prod.h(R$1, () => k({ props: __spreadValues(__spreadValues(__spreadValues({}, r2), m2), S2), slot: { open: s2.dialogState.value === 0 }, attrs: r2, slots: e2, name: "DialogBackdrop" })));
  };
} }), je = vue_cjs_prod.defineComponent({ name: "DialogPanel", props: { as: { type: [Object, String], default: "div" } }, setup(o2, { attrs: r2, slots: e2 }) {
  let i2 = P$2("DialogPanel"), s2 = `headlessui-dialog-panel-${t$1()}`;
  return () => {
    let p2 = { id: s2, ref: i2.panelRef };
    return k({ props: __spreadValues(__spreadValues({}, o2), p2), slot: { open: i2.dialogState.value === 0 }, attrs: r2, slots: e2, name: "DialogPanel" });
  };
} }), Ae = vue_cjs_prod.defineComponent({ name: "DialogTitle", props: { as: { type: [Object, String], default: "h2" } }, setup(o2, { attrs: r2, slots: e2 }) {
  let i2 = P$2("DialogTitle"), s2 = `headlessui-dialog-title-${t$1()}`;
  return vue_cjs_prod.onMounted(() => {
    i2.setTitleId(s2), vue_cjs_prod.onUnmounted(() => i2.setTitleId(null));
  }), () => k({ props: __spreadValues(__spreadValues({}, o2), { id: s2 }), slot: { open: i2.dialogState.value === 0 }, attrs: r2, slots: e2, name: "DialogTitle" });
} }), Le = S;
const dialog = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Dialog: Me,
  DialogBackdrop: $e,
  DialogDescription: Le,
  DialogOverlay: Be,
  DialogPanel: je,
  DialogTitle: Ae
}, Symbol.toStringTag, { value: "Module" }));
var w$1 = ((n2) => (n2[n2.Open = 0] = "Open", n2[n2.Closed = 1] = "Closed", n2))(w$1 || {});
let x = Symbol("DisclosureContext");
function C(l2) {
  let r2 = vue_cjs_prod.inject(x, null);
  if (r2 === null) {
    let n2 = new Error(`<${l2} /> is missing a parent <Disclosure /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(n2, C), n2;
  }
  return r2;
}
let B = Symbol("DisclosurePanelContext");
function H$2() {
  return vue_cjs_prod.inject(B, null);
}
let A = vue_cjs_prod.defineComponent({ name: "Disclosure", props: { as: { type: [Object, String], default: "template" }, defaultOpen: { type: [Boolean], default: false } }, setup(l2, { slots: r2, attrs: n2 }) {
  let d2 = `headlessui-disclosure-button-${t$1()}`, e2 = `headlessui-disclosure-panel-${t$1()}`, o2 = vue_cjs_prod.ref(l2.defaultOpen ? 0 : 1), i2 = vue_cjs_prod.ref(null), s2 = vue_cjs_prod.ref(null), u2 = { buttonId: d2, panelId: e2, disclosureState: o2, panel: i2, button: s2, toggleDisclosure() {
    o2.value = u$4(o2.value, { [0]: 1, [1]: 0 });
  }, closeDisclosure() {
    o2.value !== 1 && (o2.value = 1);
  }, close(a2) {
    u2.closeDisclosure();
    let c2 = (() => a2 ? a2 instanceof HTMLElement ? a2 : a2.value instanceof HTMLElement ? t(a2) : t(u2.button) : t(u2.button))();
    c2 == null || c2.focus();
  } };
  return vue_cjs_prod.provide(x, u2), c$3(vue_cjs_prod.computed(() => u$4(o2.value, { [0]: l$3.Open, [1]: l$3.Closed }))), () => {
    let _a2 = l2, c2 = __objRest(_a2, ["defaultOpen"]), S2 = { open: o2.value === 0, close: u2.close };
    return k({ props: c2, slot: S2, slots: r2, attrs: n2, name: "Disclosure" });
  };
} }), G = vue_cjs_prod.defineComponent({ name: "DisclosureButton", props: { as: { type: [Object, String], default: "button" }, disabled: { type: [Boolean], default: false } }, setup(l2, { attrs: r2, slots: n2, expose: d2 }) {
  let e2 = C("DisclosureButton"), o$1 = H$2(), i2 = o$1 === null ? false : o$1 === e2.panelId, s2 = vue_cjs_prod.ref(null);
  d2({ el: s2, $el: s2 }), i2 || vue_cjs_prod.watchEffect(() => {
    e2.button.value = s2.value;
  });
  let u2 = b$2(vue_cjs_prod.computed(() => ({ as: l2.as, type: r2.type })), s2);
  function a2() {
    var t$12;
    l2.disabled || (i2 ? (e2.toggleDisclosure(), (t$12 = t(e2.button)) == null || t$12.focus()) : e2.toggleDisclosure());
  }
  function c2(t$12) {
    var D2;
    if (!l2.disabled)
      if (i2)
        switch (t$12.key) {
          case o.Space:
          case o.Enter:
            t$12.preventDefault(), t$12.stopPropagation(), e2.toggleDisclosure(), (D2 = t(e2.button)) == null || D2.focus();
            break;
        }
      else
        switch (t$12.key) {
          case o.Space:
          case o.Enter:
            t$12.preventDefault(), t$12.stopPropagation(), e2.toggleDisclosure();
            break;
        }
  }
  function S2(t2) {
    switch (t2.key) {
      case o.Space:
        t2.preventDefault();
        break;
    }
  }
  return () => {
    let t$12 = { open: e2.disclosureState.value === 0 }, D2 = i2 ? { ref: s2, type: u2.value, onClick: a2, onKeydown: c2 } : { id: e2.buttonId, ref: s2, type: u2.value, "aria-expanded": l2.disabled ? void 0 : e2.disclosureState.value === 0, "aria-controls": t(e2.panel) ? e2.panelId : void 0, disabled: l2.disabled ? true : void 0, onClick: a2, onKeydown: c2, onKeyup: S2 };
    return k({ props: __spreadValues(__spreadValues({}, l2), D2), slot: t$12, attrs: r2, slots: n2, name: "DisclosureButton" });
  };
} }), J$1 = vue_cjs_prod.defineComponent({ name: "DisclosurePanel", props: { as: { type: [Object, String], default: "div" }, static: { type: Boolean, default: false }, unmount: { type: Boolean, default: true } }, setup(l2, { attrs: r2, slots: n2, expose: d2 }) {
  let e2 = C("DisclosurePanel");
  d2({ el: e2.panel, $el: e2.panel }), vue_cjs_prod.provide(B, e2.panelId);
  let o2 = p$4(), i2 = vue_cjs_prod.computed(() => o2 !== null ? o2.value === l$3.Open : e2.disclosureState.value === 0);
  return () => {
    let s2 = { open: e2.disclosureState.value === 0, close: e2.close }, u2 = { id: e2.panelId, ref: e2.panel };
    return k({ props: __spreadValues(__spreadValues({}, l2), u2), slot: s2, attrs: r2, slots: n2, features: m$1.RenderStrategy | m$1.Static, visible: i2.value, name: "DisclosurePanel" });
  };
} });
const disclosure = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Disclosure: A,
  DisclosureButton: G,
  DisclosurePanel: J$1
}, Symbol.toStringTag, { value: "Module" }));
let T$1 = vue_cjs_prod.defineComponent({ name: "FocusTrap", props: { as: { type: [Object, String], default: "div" }, initialFocus: { type: Object, default: null } }, setup(t2, { attrs: r2, slots: l2, expose: n2 }) {
  let e2 = vue_cjs_prod.ref(null);
  n2({ el: e2, $el: e2 });
  let p2 = vue_cjs_prod.computed(() => ({ initialFocus: vue_cjs_prod.ref(t2.initialFocus) }));
  return W$2(e2, T$1.All, p2), () => {
    let i2 = {}, u2 = { ref: e2 }, _a2 = t2, s2 = __objRest(_a2, ["initialFocus"]);
    return k({ props: __spreadValues(__spreadValues({}, s2), u2), slot: i2, attrs: r2, slots: l2, name: "FocusTrap" });
  };
} });
const focusTrap = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  FocusTrap: T$1
}, Symbol.toStringTag, { value: "Module" }));
let u = Symbol("LabelContext");
function a() {
  let t2 = vue_cjs_prod.inject(u, null);
  if (t2 === null) {
    let n2 = new Error("You used a <Label /> component, but it is not inside a parent.");
    throw Error.captureStackTrace && Error.captureStackTrace(n2, a), n2;
  }
  return t2;
}
function K$1({ slot: t2 = {}, name: n2 = "Label", props: i2 = {} } = {}) {
  let e2 = vue_cjs_prod.ref([]);
  function r2(o2) {
    return e2.value.push(o2), () => {
      let l2 = e2.value.indexOf(o2);
      l2 !== -1 && e2.value.splice(l2, 1);
    };
  }
  return vue_cjs_prod.provide(u, { register: r2, slot: t2, name: n2, props: i2 }), vue_cjs_prod.computed(() => e2.value.length > 0 ? e2.value.join(" ") : void 0);
}
let T = vue_cjs_prod.defineComponent({ name: "Label", props: { as: { type: [Object, String], default: "label" }, passive: { type: [Boolean], default: false } }, setup(t2, { slots: n2, attrs: i2 }) {
  let e2 = a(), r2 = `headlessui-label-${t$1()}`;
  return vue_cjs_prod.onMounted(() => vue_cjs_prod.onUnmounted(e2.register(r2))), () => {
    let { name: o2 = "Label", slot: l2 = {}, props: p2 = {} } = e2, _a2 = t2, { passive: d2 } = _a2, c2 = __objRest(_a2, ["passive"]), f2 = __spreadProps(__spreadValues({}, Object.entries(p2).reduce((m2, [b2, g2]) => Object.assign(m2, { [b2]: vue_cjs_prod.unref(g2) }), {})), { id: r2 }), s2 = __spreadValues(__spreadValues({}, c2), f2);
    return d2 && delete s2.onClick, k({ props: s2, slot: l2, attrs: i2, slots: n2, name: o2 });
  };
} });
const label = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Label: T,
  useLabels: K$1
}, Symbol.toStringTag, { value: "Module" }));
var ae$3 = ((n2) => (n2[n2.Open = 0] = "Open", n2[n2.Closed = 1] = "Closed", n2))(ae$3 || {}), le$1 = ((n2) => (n2[n2.Single = 0] = "Single", n2[n2.Multi = 1] = "Multi", n2))(le$1 || {}), ne = ((n2) => (n2[n2.Pointer = 0] = "Pointer", n2[n2.Other = 1] = "Other", n2))(ne || {});
function ue$2(o2) {
  requestAnimationFrame(() => requestAnimationFrame(o2));
}
let N = Symbol("ListboxContext");
function P$1(o2) {
  let x2 = vue_cjs_prod.inject(N, null);
  if (x2 === null) {
    let n2 = new Error(`<${o2} /> is missing a parent <Listbox /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(n2, P$1), n2;
  }
  return x2;
}
let De$1 = vue_cjs_prod.defineComponent({ name: "Listbox", emits: { "update:modelValue": (o2) => true }, props: { as: { type: [Object, String], default: "template" }, disabled: { type: [Boolean], default: false }, horizontal: { type: [Boolean], default: false }, modelValue: { type: [Object, String, Number, Boolean] }, name: { type: String, optional: true }, multiple: { type: [Boolean], default: false } }, inheritAttrs: false, setup(o2, { slots: x2, attrs: n2, emit: S2 }) {
  let e2 = vue_cjs_prod.ref(1), p2 = vue_cjs_prod.ref(null), d2 = vue_cjs_prod.ref(null), m2 = vue_cjs_prod.ref(null), r2 = vue_cjs_prod.ref([]), O$1 = vue_cjs_prod.ref(""), t$12 = vue_cjs_prod.ref(null), a2 = vue_cjs_prod.ref(1);
  function D2(i2 = (l2) => l2) {
    let l2 = t$12.value !== null ? r2.value[t$12.value] : null, u2 = v$1(i2(r2.value.slice()), (R2) => t(R2.dataRef.domRef)), f2 = l2 ? u2.indexOf(l2) : null;
    return f2 === -1 && (f2 = null), { options: u2, activeOptionIndex: f2 };
  }
  let L2 = vue_cjs_prod.computed(() => o2.modelValue), T2 = vue_cjs_prod.computed(() => o2.multiple ? 1 : 0), s2 = { listboxState: e2, value: L2, mode: T2, orientation: vue_cjs_prod.computed(() => o2.horizontal ? "horizontal" : "vertical"), labelRef: p2, buttonRef: d2, optionsRef: m2, disabled: vue_cjs_prod.computed(() => o2.disabled), options: r2, searchQuery: O$1, activeOptionIndex: t$12, activationTrigger: a2, closeListbox() {
    o2.disabled || e2.value !== 1 && (e2.value = 1, t$12.value = null);
  }, openListbox() {
    o2.disabled || e2.value !== 0 && (e2.value = 0);
  }, goToOption(i2, l2, u2) {
    if (o2.disabled || e2.value === 1)
      return;
    let f2 = D2(), R2 = x$2(i2 === a$2.Specific ? { focus: a$2.Specific, id: l2 } : { focus: i2 }, { resolveItems: () => f2.options, resolveActiveIndex: () => f2.activeOptionIndex, resolveId: (h2) => h2.id, resolveDisabled: (h2) => h2.dataRef.disabled });
    O$1.value = "", t$12.value = R2, a2.value = u2 != null ? u2 : 1, r2.value = f2.options;
  }, search(i2) {
    if (o2.disabled || e2.value === 1)
      return;
    let u2 = O$1.value !== "" ? 0 : 1;
    O$1.value += i2.toLowerCase();
    let R2 = (t$12.value !== null ? r2.value.slice(t$12.value + u2).concat(r2.value.slice(0, t$12.value + u2)) : r2.value).find((V) => V.dataRef.textValue.startsWith(O$1.value) && !V.dataRef.disabled), h2 = R2 ? r2.value.indexOf(R2) : -1;
    h2 === -1 || h2 === t$12.value || (t$12.value = h2, a2.value = 1);
  }, clearSearch() {
    o2.disabled || e2.value !== 1 && O$1.value !== "" && (O$1.value = "");
  }, registerOption(i2, l2) {
    let u2 = D2((f2) => [...f2, { id: i2, dataRef: l2 }]);
    r2.value = u2.options, t$12.value = u2.activeOptionIndex;
  }, unregisterOption(i2) {
    let l2 = D2((u2) => {
      let f2 = u2.findIndex((R2) => R2.id === i2);
      return f2 !== -1 && u2.splice(f2, 1), u2;
    });
    r2.value = l2.options, t$12.value = l2.activeOptionIndex, a2.value = 1;
  }, select(i2) {
    o2.disabled || S2("update:modelValue", u$4(T2.value, { [0]: () => i2, [1]: () => {
      let l2 = vue_cjs_prod.toRaw(s2.value.value).slice(), u2 = vue_cjs_prod.toRaw(i2), f2 = l2.indexOf(u2);
      return f2 === -1 ? l2.push(u2) : l2.splice(f2, 1), l2;
    } }));
  } };
  return vue_cjs_prod.provide(N, s2), c$3(vue_cjs_prod.computed(() => u$4(e2.value, { [0]: l$3.Open, [1]: l$3.Closed }))), () => {
    let _a2 = o2, { name: i2, modelValue: l2, disabled: u2 } = _a2, f2 = __objRest(_a2, ["name", "modelValue", "disabled"]), R2 = { open: e2.value === 0, disabled: u2 };
    return vue_cjs_prod.h(vue_cjs_prod.Fragment, [...i2 != null && l2 != null ? e$1({ [i2]: l2 }).map(([h2, V]) => vue_cjs_prod.h(l$2, O({ key: h2, as: "input", type: "hidden", hidden: true, readOnly: true, name: h2, value: V }))) : [], k({ props: __spreadValues(__spreadValues({}, n2), R$2(f2, ["onUpdate:modelValue", "horizontal", "multiple"])), slot: R2, slots: x2, attrs: n2, name: "Listbox" })]);
  };
} }), Te = vue_cjs_prod.defineComponent({ name: "ListboxLabel", props: { as: { type: [Object, String], default: "label" } }, setup(o2, { attrs: x2, slots: n2 }) {
  let S2 = P$1("ListboxLabel"), e2 = `headlessui-listbox-label-${t$1()}`;
  function p2() {
    var d2;
    (d2 = t(S2.buttonRef)) == null || d2.focus({ preventScroll: true });
  }
  return () => {
    let d2 = { open: S2.listboxState.value === 0, disabled: S2.disabled.value }, m2 = { id: e2, ref: S2.labelRef, onClick: p2 };
    return k({ props: __spreadValues(__spreadValues({}, o2), m2), slot: d2, attrs: x2, slots: n2, name: "ListboxLabel" });
  };
} }), we$1 = vue_cjs_prod.defineComponent({ name: "ListboxButton", props: { as: { type: [Object, String], default: "button" } }, setup(o$1, { attrs: x2, slots: n2, expose: S2 }) {
  let e2 = P$1("ListboxButton"), p2 = `headlessui-listbox-button-${t$1()}`;
  S2({ el: e2.buttonRef, $el: e2.buttonRef });
  function d2(t$12) {
    switch (t$12.key) {
      case o.Space:
      case o.Enter:
      case o.ArrowDown:
        t$12.preventDefault(), e2.openListbox(), vue_cjs_prod.nextTick(() => {
          var a2;
          (a2 = t(e2.optionsRef)) == null || a2.focus({ preventScroll: true }), e2.value.value || e2.goToOption(a$2.First);
        });
        break;
      case o.ArrowUp:
        t$12.preventDefault(), e2.openListbox(), vue_cjs_prod.nextTick(() => {
          var a2;
          (a2 = t(e2.optionsRef)) == null || a2.focus({ preventScroll: true }), e2.value.value || e2.goToOption(a$2.Last);
        });
        break;
    }
  }
  function m2(t2) {
    switch (t2.key) {
      case o.Space:
        t2.preventDefault();
        break;
    }
  }
  function r2(t$12) {
    e2.disabled.value || (e2.listboxState.value === 0 ? (e2.closeListbox(), vue_cjs_prod.nextTick(() => {
      var a2;
      return (a2 = t(e2.buttonRef)) == null ? void 0 : a2.focus({ preventScroll: true });
    })) : (t$12.preventDefault(), e2.openListbox(), ue$2(() => {
      var a2;
      return (a2 = t(e2.optionsRef)) == null ? void 0 : a2.focus({ preventScroll: true });
    })));
  }
  let O2 = b$2(vue_cjs_prod.computed(() => ({ as: o$1.as, type: x2.type })), e2.buttonRef);
  return () => {
    var D2, L2;
    let t$12 = { open: e2.listboxState.value === 0, disabled: e2.disabled.value }, a2 = { ref: e2.buttonRef, id: p2, type: O2.value, "aria-haspopup": true, "aria-controls": (D2 = t(e2.optionsRef)) == null ? void 0 : D2.id, "aria-expanded": e2.disabled.value ? void 0 : e2.listboxState.value === 0, "aria-labelledby": e2.labelRef.value ? [(L2 = t(e2.labelRef)) == null ? void 0 : L2.id, p2].join(" ") : void 0, disabled: e2.disabled.value === true ? true : void 0, onKeydown: d2, onKeyup: m2, onClick: r2 };
    return k({ props: __spreadValues(__spreadValues({}, o$1), a2), slot: t$12, attrs: x2, slots: n2, name: "ListboxButton" });
  };
} }), ke = vue_cjs_prod.defineComponent({ name: "ListboxOptions", props: { as: { type: [Object, String], default: "ul" }, static: { type: Boolean, default: false }, unmount: { type: Boolean, default: true } }, setup(o$1, { attrs: x2, slots: n2, expose: S2 }) {
  let e2 = P$1("ListboxOptions"), p2 = `headlessui-listbox-options-${t$1()}`, d2 = vue_cjs_prod.ref(null);
  S2({ el: e2.optionsRef, $el: e2.optionsRef });
  function m2(t$12) {
    switch (d2.value && clearTimeout(d2.value), t$12.key) {
      case o.Space:
        if (e2.searchQuery.value !== "")
          return t$12.preventDefault(), t$12.stopPropagation(), e2.search(t$12.key);
      case o.Enter:
        if (t$12.preventDefault(), t$12.stopPropagation(), e2.activeOptionIndex.value !== null) {
          let a2 = e2.options.value[e2.activeOptionIndex.value];
          e2.select(a2.dataRef.value);
        }
        e2.mode.value === 0 && (e2.closeListbox(), vue_cjs_prod.nextTick(() => {
          var a2;
          return (a2 = t(e2.buttonRef)) == null ? void 0 : a2.focus({ preventScroll: true });
        }));
        break;
      case u$4(e2.orientation.value, { vertical: o.ArrowDown, horizontal: o.ArrowRight }):
        return t$12.preventDefault(), t$12.stopPropagation(), e2.goToOption(a$2.Next);
      case u$4(e2.orientation.value, { vertical: o.ArrowUp, horizontal: o.ArrowLeft }):
        return t$12.preventDefault(), t$12.stopPropagation(), e2.goToOption(a$2.Previous);
      case o.Home:
      case o.PageUp:
        return t$12.preventDefault(), t$12.stopPropagation(), e2.goToOption(a$2.First);
      case o.End:
      case o.PageDown:
        return t$12.preventDefault(), t$12.stopPropagation(), e2.goToOption(a$2.Last);
      case o.Escape:
        t$12.preventDefault(), t$12.stopPropagation(), e2.closeListbox(), vue_cjs_prod.nextTick(() => {
          var a2;
          return (a2 = t(e2.buttonRef)) == null ? void 0 : a2.focus({ preventScroll: true });
        });
        break;
      case o.Tab:
        t$12.preventDefault(), t$12.stopPropagation();
        break;
      default:
        t$12.key.length === 1 && (e2.search(t$12.key), d2.value = setTimeout(() => e2.clearSearch(), 350));
        break;
    }
  }
  let r2 = p$4(), O2 = vue_cjs_prod.computed(() => r2 !== null ? r2.value === l$3.Open : e2.listboxState.value === 0);
  return () => {
    var L2, T2, s2, i2;
    let t$12 = { open: e2.listboxState.value === 0 }, a2 = { "aria-activedescendant": e2.activeOptionIndex.value === null || (L2 = e2.options.value[e2.activeOptionIndex.value]) == null ? void 0 : L2.id, "aria-multiselectable": e2.mode.value === 1 ? true : void 0, "aria-labelledby": (i2 = (T2 = t(e2.labelRef)) == null ? void 0 : T2.id) != null ? i2 : (s2 = t(e2.buttonRef)) == null ? void 0 : s2.id, "aria-orientation": e2.orientation.value, id: p2, onKeydown: m2, role: "listbox", tabIndex: 0, ref: e2.optionsRef };
    return k({ props: __spreadValues(__spreadValues({}, o$1), a2), slot: t$12, attrs: x2, slots: n2, features: m$1.RenderStrategy | m$1.Static, visible: O2.value, name: "ListboxOptions" });
  };
} }), Ce$1 = vue_cjs_prod.defineComponent({ name: "ListboxOption", props: { as: { type: [Object, String], default: "li" }, value: { type: [Object, String, Number, Boolean] }, disabled: { type: Boolean, default: false } }, setup(o2, { slots: x2, attrs: n2, expose: S2 }) {
  let e2 = P$1("ListboxOption"), p2 = `headlessui-listbox-option-${t$1()}`, d2 = vue_cjs_prod.ref(null);
  S2({ el: d2, $el: d2 });
  let m2 = vue_cjs_prod.computed(() => e2.activeOptionIndex.value !== null ? e2.options.value[e2.activeOptionIndex.value].id === p2 : false), r2 = vue_cjs_prod.computed(() => u$4(e2.mode.value, { [0]: () => vue_cjs_prod.toRaw(e2.value.value) === vue_cjs_prod.toRaw(o2.value), [1]: () => vue_cjs_prod.toRaw(e2.value.value).includes(vue_cjs_prod.toRaw(o2.value)) })), O2 = vue_cjs_prod.computed(() => u$4(e2.mode.value, { [1]: () => {
    var i2;
    let s2 = vue_cjs_prod.toRaw(e2.value.value);
    return ((i2 = e2.options.value.find((l2) => s2.includes(l2.dataRef.value))) == null ? void 0 : i2.id) === p2;
  }, [0]: () => r2.value })), t$2 = vue_cjs_prod.computed(() => ({ disabled: o2.disabled, value: o2.value, textValue: "", domRef: d2 }));
  vue_cjs_prod.onMounted(() => {
    var i2, l2;
    let s2 = (l2 = (i2 = t(d2)) == null ? void 0 : i2.textContent) == null ? void 0 : l2.toLowerCase().trim();
    s2 !== void 0 && (t$2.value.textValue = s2);
  }), vue_cjs_prod.onMounted(() => e2.registerOption(p2, t$2)), vue_cjs_prod.onUnmounted(() => e2.unregisterOption(p2)), vue_cjs_prod.onMounted(() => {
    vue_cjs_prod.watch([e2.listboxState, r2], () => {
      e2.listboxState.value === 0 && (!r2.value || u$4(e2.mode.value, { [1]: () => {
        O2.value && e2.goToOption(a$2.Specific, p2);
      }, [0]: () => {
        e2.goToOption(a$2.Specific, p2);
      } }));
    }, { immediate: true });
  }), vue_cjs_prod.watchEffect(() => {
    e2.listboxState.value === 0 && (!m2.value || e2.activationTrigger.value !== 0 && vue_cjs_prod.nextTick(() => {
      var s2, i2;
      return (i2 = (s2 = t(d2)) == null ? void 0 : s2.scrollIntoView) == null ? void 0 : i2.call(s2, { block: "nearest" });
    }));
  });
  function a2(s2) {
    if (o2.disabled)
      return s2.preventDefault();
    e2.select(o2.value), e2.mode.value === 0 && (e2.closeListbox(), vue_cjs_prod.nextTick(() => {
      var i2;
      return (i2 = t(e2.buttonRef)) == null ? void 0 : i2.focus({ preventScroll: true });
    }));
  }
  function D2() {
    if (o2.disabled)
      return e2.goToOption(a$2.Nothing);
    e2.goToOption(a$2.Specific, p2);
  }
  function L2() {
    o2.disabled || m2.value || e2.goToOption(a$2.Specific, p2, 0);
  }
  function T2() {
    o2.disabled || !m2.value || e2.goToOption(a$2.Nothing);
  }
  return () => {
    let { disabled: s2 } = o2, i2 = { active: m2.value, selected: r2.value, disabled: s2 }, l2 = { id: p2, ref: d2, role: "option", tabIndex: s2 === true ? void 0 : -1, "aria-disabled": s2 === true ? true : void 0, "aria-selected": r2.value === true ? r2.value : void 0, disabled: void 0, onClick: a2, onFocus: D2, onPointermove: L2, onMousemove: L2, onPointerleave: T2, onMouseleave: T2 };
    return k({ props: __spreadValues(__spreadValues({}, R$2(o2, ["value", "disabled"])), l2), slot: i2, attrs: n2, slots: x2, name: "ListboxOption" });
  };
} });
const listbox = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Listbox: De$1,
  ListboxButton: we$1,
  ListboxLabel: Te,
  ListboxOption: Ce$1,
  ListboxOptions: ke
}, Symbol.toStringTag, { value: "Module" }));
var W$1 = ((i2) => (i2[i2.Open = 0] = "Open", i2[i2.Closed = 1] = "Closed", i2))(W$1 || {}), J = ((i2) => (i2[i2.Pointer = 0] = "Pointer", i2[i2.Other = 1] = "Other", i2))(J || {});
function z(o2) {
  requestAnimationFrame(() => requestAnimationFrame(o2));
}
let E = Symbol("MenuContext");
function D(o2) {
  let S2 = vue_cjs_prod.inject(E, null);
  if (S2 === null) {
    let i2 = new Error(`<${o2} /> is missing a parent <Menu /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(i2, D), i2;
  }
  return S2;
}
let fe$1 = vue_cjs_prod.defineComponent({ name: "Menu", props: { as: { type: [Object, String], default: "template" } }, setup(o2, { slots: S2, attrs: i2 }) {
  let v2 = vue_cjs_prod.ref(1), e2 = vue_cjs_prod.ref(null), p2 = vue_cjs_prod.ref(null), r2 = vue_cjs_prod.ref([]), f2 = vue_cjs_prod.ref(""), d2 = vue_cjs_prod.ref(null), I2 = vue_cjs_prod.ref(1);
  function l2(u2 = (n2) => n2) {
    let n2 = d2.value !== null ? r2.value[d2.value] : null, a2 = v$1(u2(r2.value.slice()), (R2) => t(R2.dataRef.domRef)), s2 = n2 ? a2.indexOf(n2) : null;
    return s2 === -1 && (s2 = null), { items: a2, activeItemIndex: s2 };
  }
  let t$12 = { menuState: v2, buttonRef: e2, itemsRef: p2, items: r2, searchQuery: f2, activeItemIndex: d2, activationTrigger: I2, closeMenu: () => {
    v2.value = 1, d2.value = null;
  }, openMenu: () => v2.value = 0, goToItem(u2, n2, a2) {
    let s2 = l2(), R2 = x$2(u2 === a$2.Specific ? { focus: a$2.Specific, id: n2 } : { focus: u2 }, { resolveItems: () => s2.items, resolveActiveIndex: () => s2.activeItemIndex, resolveId: (M2) => M2.id, resolveDisabled: (M2) => M2.dataRef.disabled });
    f2.value = "", d2.value = R2, I2.value = a2 != null ? a2 : 1, r2.value = s2.items;
  }, search(u2) {
    let a2 = f2.value !== "" ? 0 : 1;
    f2.value += u2.toLowerCase();
    let R2 = (d2.value !== null ? r2.value.slice(d2.value + a2).concat(r2.value.slice(0, d2.value + a2)) : r2.value).find((k2) => k2.dataRef.textValue.startsWith(f2.value) && !k2.dataRef.disabled), M2 = R2 ? r2.value.indexOf(R2) : -1;
    M2 === -1 || M2 === d2.value || (d2.value = M2, I2.value = 1);
  }, clearSearch() {
    f2.value = "";
  }, registerItem(u2, n2) {
    let a2 = l2((s2) => [...s2, { id: u2, dataRef: n2 }]);
    r2.value = a2.items, d2.value = a2.activeItemIndex, I2.value = 1;
  }, unregisterItem(u2) {
    let n2 = l2((a2) => {
      let s2 = a2.findIndex((R2) => R2.id === u2);
      return s2 !== -1 && a2.splice(s2, 1), a2;
    });
    r2.value = n2.items, d2.value = n2.activeItemIndex, I2.value = 1;
  } };
  return vue_cjs_prod.provide(E, t$12), c$3(vue_cjs_prod.computed(() => u$4(v2.value, { [0]: l$3.Open, [1]: l$3.Closed }))), () => {
    let u2 = { open: v2.value === 0 };
    return k({ props: o2, slot: u2, slots: S2, attrs: i2, name: "Menu" });
  };
} }), me$1 = vue_cjs_prod.defineComponent({ name: "MenuButton", props: { disabled: { type: Boolean, default: false }, as: { type: [Object, String], default: "button" } }, setup(o$1, { attrs: S2, slots: i2, expose: v2 }) {
  let e2 = D("MenuButton"), p2 = `headlessui-menu-button-${t$1()}`;
  v2({ el: e2.buttonRef, $el: e2.buttonRef });
  function r2(l2) {
    switch (l2.key) {
      case o.Space:
      case o.Enter:
      case o.ArrowDown:
        l2.preventDefault(), l2.stopPropagation(), e2.openMenu(), vue_cjs_prod.nextTick(() => {
          var t$12;
          (t$12 = t(e2.itemsRef)) == null || t$12.focus({ preventScroll: true }), e2.goToItem(a$2.First);
        });
        break;
      case o.ArrowUp:
        l2.preventDefault(), l2.stopPropagation(), e2.openMenu(), vue_cjs_prod.nextTick(() => {
          var t$12;
          (t$12 = t(e2.itemsRef)) == null || t$12.focus({ preventScroll: true }), e2.goToItem(a$2.Last);
        });
        break;
    }
  }
  function f2(l2) {
    switch (l2.key) {
      case o.Space:
        l2.preventDefault();
        break;
    }
  }
  function d2(l2) {
    o$1.disabled || (e2.menuState.value === 0 ? (e2.closeMenu(), vue_cjs_prod.nextTick(() => {
      var t$12;
      return (t$12 = t(e2.buttonRef)) == null ? void 0 : t$12.focus({ preventScroll: true });
    })) : (l2.preventDefault(), l2.stopPropagation(), e2.openMenu(), z(() => {
      var t$12;
      return (t$12 = t(e2.itemsRef)) == null ? void 0 : t$12.focus({ preventScroll: true });
    })));
  }
  let I2 = b$2(vue_cjs_prod.computed(() => ({ as: o$1.as, type: S2.type })), e2.buttonRef);
  return () => {
    var u2;
    let l2 = { open: e2.menuState.value === 0 }, t$12 = { ref: e2.buttonRef, id: p2, type: I2.value, "aria-haspopup": true, "aria-controls": (u2 = t(e2.itemsRef)) == null ? void 0 : u2.id, "aria-expanded": o$1.disabled ? void 0 : e2.menuState.value === 0, onKeydown: r2, onKeyup: f2, onClick: d2 };
    return k({ props: __spreadValues(__spreadValues({}, o$1), t$12), slot: l2, attrs: S2, slots: i2, name: "MenuButton" });
  };
} }), pe$1 = vue_cjs_prod.defineComponent({ name: "MenuItems", props: { as: { type: [Object, String], default: "div" }, static: { type: Boolean, default: false }, unmount: { type: Boolean, default: true } }, setup(o$1, { attrs: S2, slots: i2, expose: v2 }) {
  let e2 = D("MenuItems"), p2 = `headlessui-menu-items-${t$1()}`, r2 = vue_cjs_prod.ref(null);
  v2({ el: e2.itemsRef, $el: e2.itemsRef }), p$3({ container: vue_cjs_prod.computed(() => t(e2.itemsRef)), enabled: vue_cjs_prod.computed(() => e2.menuState.value === 0), accept(t2) {
    return t2.getAttribute("role") === "menuitem" ? NodeFilter.FILTER_REJECT : t2.hasAttribute("role") ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT;
  }, walk(t2) {
    t2.setAttribute("role", "none");
  } });
  function f2(t$12) {
    var u2;
    switch (r2.value && clearTimeout(r2.value), t$12.key) {
      case o.Space:
        if (e2.searchQuery.value !== "")
          return t$12.preventDefault(), t$12.stopPropagation(), e2.search(t$12.key);
      case o.Enter:
        if (t$12.preventDefault(), t$12.stopPropagation(), e2.activeItemIndex.value !== null) {
          let a2 = e2.items.value[e2.activeItemIndex.value];
          (u2 = t(a2.dataRef.domRef)) == null || u2.click();
        }
        e2.closeMenu(), vue_cjs_prod.nextTick(() => {
          var n2;
          return (n2 = t(e2.buttonRef)) == null ? void 0 : n2.focus({ preventScroll: true });
        });
        break;
      case o.ArrowDown:
        return t$12.preventDefault(), t$12.stopPropagation(), e2.goToItem(a$2.Next);
      case o.ArrowUp:
        return t$12.preventDefault(), t$12.stopPropagation(), e2.goToItem(a$2.Previous);
      case o.Home:
      case o.PageUp:
        return t$12.preventDefault(), t$12.stopPropagation(), e2.goToItem(a$2.First);
      case o.End:
      case o.PageDown:
        return t$12.preventDefault(), t$12.stopPropagation(), e2.goToItem(a$2.Last);
      case o.Escape:
        t$12.preventDefault(), t$12.stopPropagation(), e2.closeMenu(), vue_cjs_prod.nextTick(() => {
          var n2;
          return (n2 = t(e2.buttonRef)) == null ? void 0 : n2.focus({ preventScroll: true });
        });
        break;
      case o.Tab:
        t$12.preventDefault(), t$12.stopPropagation();
        break;
      default:
        t$12.key.length === 1 && (e2.search(t$12.key), r2.value = setTimeout(() => e2.clearSearch(), 350));
        break;
    }
  }
  function d2(t2) {
    switch (t2.key) {
      case o.Space:
        t2.preventDefault();
        break;
    }
  }
  let I2 = p$4(), l2 = vue_cjs_prod.computed(() => I2 !== null ? I2.value === l$3.Open : e2.menuState.value === 0);
  return () => {
    var a2, s2;
    let t$12 = { open: e2.menuState.value === 0 }, u2 = { "aria-activedescendant": e2.activeItemIndex.value === null || (a2 = e2.items.value[e2.activeItemIndex.value]) == null ? void 0 : a2.id, "aria-labelledby": (s2 = t(e2.buttonRef)) == null ? void 0 : s2.id, id: p2, onKeydown: f2, onKeyup: d2, role: "menu", tabIndex: 0, ref: e2.itemsRef };
    return k({ props: __spreadValues(__spreadValues({}, o$1), u2), slot: t$12, attrs: S2, slots: i2, features: m$1.RenderStrategy | m$1.Static, visible: l2.value, name: "MenuItems" });
  };
} }), ve$1 = vue_cjs_prod.defineComponent({ name: "MenuItem", props: { as: { type: [Object, String], default: "template" }, disabled: { type: Boolean, default: false } }, setup(o2, { slots: S2, attrs: i2, expose: v2 }) {
  let e2 = D("MenuItem"), p2 = `headlessui-menu-item-${t$1()}`, r2 = vue_cjs_prod.ref(null);
  v2({ el: r2, $el: r2 });
  let f2 = vue_cjs_prod.computed(() => e2.activeItemIndex.value !== null ? e2.items.value[e2.activeItemIndex.value].id === p2 : false), d2 = vue_cjs_prod.computed(() => ({ disabled: o2.disabled, textValue: "", domRef: r2 }));
  vue_cjs_prod.onMounted(() => {
    var a2, s2;
    let n2 = (s2 = (a2 = t(r2)) == null ? void 0 : a2.textContent) == null ? void 0 : s2.toLowerCase().trim();
    n2 !== void 0 && (d2.value.textValue = n2);
  }), vue_cjs_prod.onMounted(() => e2.registerItem(p2, d2)), vue_cjs_prod.onUnmounted(() => e2.unregisterItem(p2)), vue_cjs_prod.watchEffect(() => {
    e2.menuState.value === 0 && (!f2.value || e2.activationTrigger.value !== 0 && vue_cjs_prod.nextTick(() => {
      var n2, a2;
      return (a2 = (n2 = t(r2)) == null ? void 0 : n2.scrollIntoView) == null ? void 0 : a2.call(n2, { block: "nearest" });
    }));
  });
  function I2(n2) {
    if (o2.disabled)
      return n2.preventDefault();
    e2.closeMenu(), vue_cjs_prod.nextTick(() => {
      var a2;
      return (a2 = t(e2.buttonRef)) == null ? void 0 : a2.focus({ preventScroll: true });
    });
  }
  function l2() {
    if (o2.disabled)
      return e2.goToItem(a$2.Nothing);
    e2.goToItem(a$2.Specific, p2);
  }
  function t$2() {
    o2.disabled || f2.value || e2.goToItem(a$2.Specific, p2, 0);
  }
  function u2() {
    o2.disabled || !f2.value || e2.goToItem(a$2.Nothing);
  }
  return () => {
    let { disabled: n2 } = o2, a2 = { active: f2.value, disabled: n2 };
    return k({ props: __spreadValues(__spreadValues({}, o2), { id: p2, ref: r2, role: "menuitem", tabIndex: n2 === true ? void 0 : -1, "aria-disabled": n2 === true ? true : void 0, onClick: I2, onFocus: l2, onPointermove: t$2, onMousemove: t$2, onPointerleave: u2, onMouseleave: u2 }), slot: a2, attrs: i2, slots: S2, name: "MenuItem" });
  };
} });
const menu = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Menu: fe$1,
  MenuButton: me$1,
  MenuItem: ve$1,
  MenuItems: pe$1
}, Symbol.toStringTag, { value: "Module" }));
var ae$2 = ((f2) => (f2[f2.Open = 0] = "Open", f2[f2.Closed = 1] = "Closed", f2))(ae$2 || {});
let Q = Symbol("PopoverContext");
function H$1(c2) {
  let m2 = vue_cjs_prod.inject(Q, null);
  if (m2 === null) {
    let f2 = new Error(`<${c2} /> is missing a parent <${pe.name} /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(f2, H$1), f2;
  }
  return m2;
}
let X$1 = Symbol("PopoverGroupContext");
function Y$3() {
  return vue_cjs_prod.inject(X$1, null);
}
let Z$2 = Symbol("PopoverPanelContext");
function ue$1() {
  return vue_cjs_prod.inject(Z$2, null);
}
let pe = vue_cjs_prod.defineComponent({ name: "Popover", props: { as: { type: [Object, String], default: "div" } }, setup(c2, { slots: m2, attrs: f2, expose: y }) {
  var g2;
  let e2 = `headlessui-popover-button-${t$1()}`, t$2 = `headlessui-popover-panel-${t$1()}`, p2 = vue_cjs_prod.ref(null);
  y({ el: p2, $el: p2 });
  let a2 = vue_cjs_prod.ref(1), P2 = vue_cjs_prod.ref(null), d2 = vue_cjs_prod.ref(null), S2 = vue_cjs_prod.computed(() => e$2()), r2 = { popoverState: a2, buttonId: e2, panelId: t$2, panel: d2, button: P2, togglePopover() {
    a2.value = u$4(a2.value, { [0]: 1, [1]: 0 });
  }, closePopover() {
    a2.value !== 1 && (a2.value = 1);
  }, close(s2) {
    r2.closePopover();
    let o2 = (() => s2 ? s2 instanceof HTMLElement ? s2 : s2.value instanceof HTMLElement ? t(s2) : t(r2.button) : t(r2.button))();
    o2 == null || o2.focus();
  } };
  vue_cjs_prod.provide(Q, r2), c$3(vue_cjs_prod.computed(() => u$4(a2.value, { [0]: l$3.Open, [1]: l$3.Closed })));
  let l2 = { buttonId: e2, panelId: t$2, close() {
    r2.closePopover();
  } }, u2 = Y$3(), i2 = u2 == null ? void 0 : u2.registerPopover;
  return vue_cjs_prod.watchEffect(() => i2 == null ? void 0 : i2(l2)), r$2((g2 = S2.value) == null ? void 0 : g2.defaultView), () => {
    let s2 = { open: a2.value === 0, close: r2.close };
    return k({ props: __spreadProps(__spreadValues({}, c2), { ref: p2 }), slot: s2, slots: m2, attrs: f2, name: "Popover" });
  };
} }), xe = vue_cjs_prod.defineComponent({ name: "PopoverButton", props: { as: { type: [Object, String], default: "button" }, disabled: { type: [Boolean], default: false } }, setup(c2, { attrs: m2, slots: f2, expose: y }) {
  var s2;
  let e2 = H$1("PopoverButton"), t$12 = vue_cjs_prod.computed(() => e$2(e2.button));
  y({ el: e2.button, $el: e2.button });
  let p2 = Y$3(), a2 = p2 == null ? void 0 : p2.closeOthers, P2 = ue$1(), d2 = P2 === null ? false : P2 === e2.panelId;
  vue_cjs_prod.ref(null);
  let r2 = vue_cjs_prod.ref();
  r$2((s2 = t$12.value) == null ? void 0 : s2.defaultView);
  let l2 = vue_cjs_prod.ref(null);
  d2 || vue_cjs_prod.watchEffect(() => {
    e2.button.value = l2.value;
  });
  let u2 = b$2(vue_cjs_prod.computed(() => ({ as: c2.as, type: m2.type })), l2);
  function i2(o$1) {
    var v2, b2, x2, h2, R2, F2, A2, N2;
    if (d2) {
      if (e2.popoverState.value === 1)
        return;
      switch (o$1.key) {
        case o.Space:
        case o.Enter:
          o$1.preventDefault(), (b2 = (v2 = o$1.target).click) == null || b2.call(v2), e2.closePopover(), (x2 = t(e2.button)) == null || x2.focus();
          break;
      }
    } else
      switch (o$1.key) {
        case o.Space:
        case o.Enter:
          o$1.preventDefault(), o$1.stopPropagation(), e2.popoverState.value === 1 && (a2 == null || a2(e2.buttonId)), e2.togglePopover();
          break;
        case o.Escape:
          if (e2.popoverState.value !== 0)
            return a2 == null ? void 0 : a2(e2.buttonId);
          if (!t(e2.button) || ((h2 = t$12.value) == null ? void 0 : h2.activeElement) && !((R2 = t(e2.button)) != null && R2.contains(t$12.value.activeElement)))
            return;
          o$1.preventDefault(), o$1.stopPropagation(), e2.closePopover();
          break;
        case o.Tab:
          if (e2.popoverState.value !== 0 || !e2.panel || !e2.button)
            return;
          if (o$1.shiftKey) {
            if (!r2.value || (F2 = t(e2.button)) != null && F2.contains(r2.value) || (A2 = t(e2.panel)) != null && A2.contains(r2.value))
              return;
            let q = T$3((N2 = t$12.value) == null ? void 0 : N2.body), _2 = q.indexOf(r2.value);
            if (q.indexOf(t(e2.button)) > _2)
              return;
            o$1.preventDefault(), o$1.stopPropagation(), H$3(t(e2.panel), p$2.Last);
          } else
            o$1.preventDefault(), o$1.stopPropagation(), H$3(t(e2.panel), p$2.First);
          break;
      }
  }
  function O2(o$1) {
    var v2, b2, x2;
    if (!d2 && (o$1.key === o.Space && o$1.preventDefault(), e2.popoverState.value === 0 && !!e2.panel && !!e2.button))
      switch (o$1.key) {
        case o.Tab:
          if (!r2.value || (v2 = t(e2.button)) != null && v2.contains(r2.value) || (b2 = t(e2.panel)) != null && b2.contains(r2.value))
            return;
          let h2 = T$3((x2 = t$12.value) == null ? void 0 : x2.body), R2 = h2.indexOf(r2.value);
          if (h2.indexOf(t(e2.button)) > R2)
            return;
          o$1.preventDefault(), o$1.stopPropagation(), H$3(t(e2.panel), p$2.Last);
          break;
      }
  }
  function g2(o2) {
    var v2, b2;
    c2.disabled || (d2 ? (e2.closePopover(), (v2 = t(e2.button)) == null || v2.focus()) : (o2.preventDefault(), o2.stopPropagation(), e2.popoverState.value === 1 && (a2 == null || a2(e2.buttonId)), (b2 = t(e2.button)) == null || b2.focus(), e2.togglePopover()));
  }
  return () => {
    let o2 = { open: e2.popoverState.value === 0 }, v2 = d2 ? { ref: l2, type: u2.value, onKeydown: i2, onClick: g2 } : { ref: l2, id: e2.buttonId, type: u2.value, "aria-expanded": c2.disabled ? void 0 : e2.popoverState.value === 0, "aria-controls": t(e2.panel) ? e2.panelId : void 0, disabled: c2.disabled ? true : void 0, onKeydown: i2, onKeyup: O2, onClick: g2 };
    return k({ props: __spreadValues(__spreadValues({}, c2), v2), slot: o2, attrs: m2, slots: f2, name: "PopoverButton" });
  };
} }), Ce = vue_cjs_prod.defineComponent({ name: "PopoverOverlay", props: { as: { type: [Object, String], default: "div" }, static: { type: Boolean, default: false }, unmount: { type: Boolean, default: true } }, setup(c2, { attrs: m2, slots: f2 }) {
  let y = H$1("PopoverOverlay"), e2 = `headlessui-popover-overlay-${t$1()}`, t2 = p$4(), p2 = vue_cjs_prod.computed(() => t2 !== null ? t2.value === l$3.Open : y.popoverState.value === 0);
  function a2() {
    y.closePopover();
  }
  return () => {
    let P2 = { open: y.popoverState.value === 0 };
    return k({ props: __spreadValues(__spreadValues({}, c2), { id: e2, "aria-hidden": true, onClick: a2 }), slot: P2, attrs: m2, slots: f2, features: m$1.RenderStrategy | m$1.Static, visible: p2.value, name: "PopoverOverlay" });
  };
} }), we = vue_cjs_prod.defineComponent({ name: "PopoverPanel", props: { as: { type: [Object, String], default: "div" }, static: { type: Boolean, default: false }, unmount: { type: Boolean, default: true }, focus: { type: Boolean, default: false } }, setup(c2, { attrs: m2, slots: f2, expose: y }) {
  var S2, r2;
  let { focus: e2 } = c2, t$12 = H$1("PopoverPanel"), p2 = vue_cjs_prod.computed(() => e$2(t$12.panel));
  y({ el: t$12.panel, $el: t$12.panel }), vue_cjs_prod.provide(Z$2, t$12.panelId), vue_cjs_prod.onUnmounted(() => {
    t$12.panel.value = null;
  }), vue_cjs_prod.watchEffect(() => {
    var u2, i2;
    if (!e2 || t$12.popoverState.value !== 0 || !t$12.panel)
      return;
    let l2 = (u2 = p2.value) == null ? void 0 : u2.activeElement;
    (i2 = t(t$12.panel)) != null && i2.contains(l2) || H$3(t(t$12.panel), p$2.First);
  }), r$2((S2 = p2.value) == null ? void 0 : S2.defaultView), r$2((r2 = p2.value) == null ? void 0 : r2.defaultView);
  let a2 = p$4(), P2 = vue_cjs_prod.computed(() => a2 !== null ? a2.value === l$3.Open : t$12.popoverState.value === 0);
  function d2(l2) {
    var u2, i2;
    switch (l2.key) {
      case o.Escape:
        if (t$12.popoverState.value !== 0 || !t(t$12.panel) || p2.value && !((u2 = t(t$12.panel)) != null && u2.contains(p2.value.activeElement)))
          return;
        l2.preventDefault(), l2.stopPropagation(), t$12.closePopover(), (i2 = t(t$12.button)) == null || i2.focus();
        break;
    }
  }
  return () => {
    let l2 = { open: t$12.popoverState.value === 0, close: t$12.close }, u2 = { ref: t$12.panel, id: t$12.panelId, onKeydown: d2 };
    return k({ props: __spreadValues(__spreadValues({}, c2), u2), slot: l2, attrs: m2, slots: f2, features: m$1.RenderStrategy | m$1.Static, visible: P2.value, name: "PopoverPanel" });
  };
} }), De = vue_cjs_prod.defineComponent({ name: "PopoverGroup", props: { as: { type: [Object, String], default: "div" } }, setup(c2, { attrs: m2, slots: f2, expose: y }) {
  let e2 = vue_cjs_prod.ref(null), t$12 = vue_cjs_prod.ref([]), p2 = vue_cjs_prod.computed(() => e$2());
  y({ el: e2, $el: e2 });
  function a2(r2) {
    let l2 = t$12.value.indexOf(r2);
    l2 !== -1 && t$12.value.splice(l2, 1);
  }
  function P2(r2) {
    return t$12.value.push(r2), () => {
      a2(r2);
    };
  }
  function d2() {
    var u2;
    let r2 = p2.value;
    if (!r2)
      return false;
    let l2 = r2.activeElement;
    return (u2 = t(e2)) != null && u2.contains(l2) ? true : t$12.value.some((i2) => {
      var O2, g2;
      return ((O2 = r2.getElementById(i2.buttonId)) == null ? void 0 : O2.contains(l2)) || ((g2 = r2.getElementById(i2.panelId)) == null ? void 0 : g2.contains(l2));
    });
  }
  function S2(r2) {
    for (let l2 of t$12.value)
      l2.buttonId !== r2 && l2.close();
  }
  return vue_cjs_prod.provide(X$1, { registerPopover: P2, unregisterPopover: a2, isFocusWithinPopoverGroup: d2, closeOthers: S2 }), () => k({ props: __spreadValues(__spreadValues({}, c2), { ref: e2 }), slot: {}, attrs: m2, slots: f2, name: "PopoverGroup" });
} });
const popover = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Popover: pe,
  PopoverButton: xe,
  PopoverGroup: De,
  PopoverOverlay: Ce,
  PopoverPanel: we
}, Symbol.toStringTag, { value: "Module" }));
let I = Symbol("RadioGroupContext");
function P(i2) {
  let v2 = vue_cjs_prod.inject(I, null);
  if (v2 === null) {
    let n2 = new Error(`<${i2} /> is missing a parent <RadioGroup /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(n2, P), n2;
  }
  return v2;
}
let me = vue_cjs_prod.defineComponent({ name: "RadioGroup", emits: { "update:modelValue": (i2) => true }, props: { as: { type: [Object, String], default: "div" }, disabled: { type: [Boolean], default: false }, modelValue: { type: [Object, String, Number, Boolean] }, name: { type: String, optional: true } }, inheritAttrs: false, setup(i2, { emit: v2, attrs: n2, slots: h2, expose: s2 }) {
  let u2 = vue_cjs_prod.ref(null), o$1 = vue_cjs_prod.ref([]), E2 = K$1({ name: "RadioGroupLabel" }), m2 = P$4({ name: "RadioGroupDescription" });
  s2({ el: u2, $el: u2 });
  let g2 = vue_cjs_prod.computed(() => i2.modelValue), f2 = { options: o$1, value: g2, disabled: vue_cjs_prod.computed(() => i2.disabled), firstOption: vue_cjs_prod.computed(() => o$1.value.find((e2) => !e2.propsRef.disabled)), containsCheckedOption: vue_cjs_prod.computed(() => o$1.value.some((e2) => vue_cjs_prod.toRaw(e2.propsRef.value) === vue_cjs_prod.toRaw(i2.modelValue))), change(e2) {
    var t2;
    if (i2.disabled || g2.value === e2)
      return false;
    let r2 = (t2 = o$1.value.find((l2) => vue_cjs_prod.toRaw(l2.propsRef.value) === vue_cjs_prod.toRaw(e2))) == null ? void 0 : t2.propsRef;
    return r2 != null && r2.disabled ? false : (v2("update:modelValue", e2), true);
  }, registerOption(e2) {
    o$1.value.push(e2), o$1.value = v$1(o$1.value, (r2) => r2.element);
  }, unregisterOption(e2) {
    let r2 = o$1.value.findIndex((t2) => t2.id === e2);
    r2 !== -1 && o$1.value.splice(r2, 1);
  } };
  vue_cjs_prod.provide(I, f2), p$3({ container: vue_cjs_prod.computed(() => t(u2)), accept(e2) {
    return e2.getAttribute("role") === "radio" ? NodeFilter.FILTER_REJECT : e2.hasAttribute("role") ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT;
  }, walk(e2) {
    e2.setAttribute("role", "none");
  } });
  function k$1(e2) {
    if (!u2.value || !u2.value.contains(e2.target))
      return;
    let r2 = o$1.value.filter((t2) => t2.propsRef.disabled === false).map((t2) => t2.element);
    switch (e2.key) {
      case o.Enter:
        p(e2.currentTarget);
        break;
      case o.ArrowLeft:
      case o.ArrowUp:
        if (e2.preventDefault(), e2.stopPropagation(), H$3(r2, p$2.Previous | p$2.WrapAround) === L$2.Success) {
          let l2 = o$1.value.find((d2) => {
            var a2;
            return d2.element === ((a2 = e$2()) == null ? void 0 : a2.activeElement);
          });
          l2 && f2.change(l2.propsRef.value);
        }
        break;
      case o.ArrowRight:
      case o.ArrowDown:
        if (e2.preventDefault(), e2.stopPropagation(), H$3(r2, p$2.Next | p$2.WrapAround) === L$2.Success) {
          let l2 = o$1.value.find((d2) => {
            var a2;
            return d2.element === ((a2 = e$2(d2.element)) == null ? void 0 : a2.activeElement);
          });
          l2 && f2.change(l2.propsRef.value);
        }
        break;
      case o.Space:
        {
          e2.preventDefault(), e2.stopPropagation();
          let t2 = o$1.value.find((l2) => {
            var d2;
            return l2.element === ((d2 = e$2(l2.element)) == null ? void 0 : d2.activeElement);
          });
          t2 && f2.change(t2.propsRef.value);
        }
        break;
    }
  }
  let c2 = `headlessui-radiogroup-${t$1()}`;
  return () => {
    let _a2 = i2, { modelValue: e2, disabled: r2, name: t2 } = _a2, l2 = __objRest(_a2, ["modelValue", "disabled", "name"]), d2 = { ref: u2, id: c2, role: "radiogroup", "aria-labelledby": E2.value, "aria-describedby": m2.value, onKeydown: k$1 };
    return vue_cjs_prod.h(vue_cjs_prod.Fragment, [...t2 != null && e2 != null ? e$1({ [t2]: e2 }).map(([a2, w2]) => vue_cjs_prod.h(l$2, O({ key: a2, as: "input", type: "hidden", hidden: true, readOnly: true, name: a2, value: w2 }))) : [], k({ props: __spreadValues(__spreadValues(__spreadValues({}, n2), l2), d2), slot: {}, attrs: n2, slots: h2, name: "RadioGroup" })]);
  };
} });
var Y$2 = ((n2) => (n2[n2.Empty = 1] = "Empty", n2[n2.Active = 2] = "Active", n2))(Y$2 || {});
let ve = vue_cjs_prod.defineComponent({ name: "RadioGroupOption", props: { as: { type: [Object, String], default: "div" }, value: { type: [Object, String, Number, Boolean] }, disabled: { type: Boolean, default: false } }, setup(i2, { attrs: v2, slots: n2, expose: h2 }) {
  let s2 = P("RadioGroupOption"), u2 = `headlessui-radiogroup-option-${t$1()}`, o2 = K$1({ name: "RadioGroupLabel" }), E2 = P$4({ name: "RadioGroupDescription" }), m2 = vue_cjs_prod.ref(null), g2 = vue_cjs_prod.computed(() => ({ value: i2.value, disabled: i2.disabled })), f2 = vue_cjs_prod.ref(1);
  h2({ el: m2, $el: m2 }), vue_cjs_prod.onMounted(() => s2.registerOption({ id: u2, element: m2, propsRef: g2 })), vue_cjs_prod.onUnmounted(() => s2.unregisterOption(u2));
  let k$1 = vue_cjs_prod.computed(() => {
    var a2;
    return ((a2 = s2.firstOption.value) == null ? void 0 : a2.id) === u2;
  }), c2 = vue_cjs_prod.computed(() => s2.disabled.value || i2.disabled), e2 = vue_cjs_prod.computed(() => vue_cjs_prod.toRaw(s2.value.value) === vue_cjs_prod.toRaw(i2.value)), r2 = vue_cjs_prod.computed(() => c2.value ? -1 : e2.value || !s2.containsCheckedOption.value && k$1.value ? 0 : -1);
  function t2() {
    var a2;
    !s2.change(i2.value) || (f2.value |= 2, (a2 = m2.value) == null || a2.focus());
  }
  function l2() {
    f2.value |= 2;
  }
  function d2() {
    f2.value &= -3;
  }
  return () => {
    let a2 = R$2(i2, ["value", "disabled"]), w2 = { checked: e2.value, disabled: c2.value, active: Boolean(f2.value & 2) }, B2 = { id: u2, ref: m2, role: "radio", "aria-checked": e2.value ? "true" : "false", "aria-labelledby": o2.value, "aria-describedby": E2.value, "aria-disabled": c2.value ? true : void 0, tabIndex: r2.value, onClick: c2.value ? void 0 : t2, onFocus: c2.value ? void 0 : l2, onBlur: c2.value ? void 0 : d2 };
    return k({ props: __spreadValues(__spreadValues({}, a2), B2), slot: w2, attrs: v2, slots: n2, name: "RadioGroupOption" });
  };
} }), be = T, Re = S;
const radioGroup = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  RadioGroup: me,
  RadioGroupDescription: Re,
  RadioGroupLabel: be,
  RadioGroupOption: ve
}, Symbol.toStringTag, { value: "Module" }));
let b = Symbol("GroupContext"), W = vue_cjs_prod.defineComponent({ name: "SwitchGroup", props: { as: { type: [Object, String], default: "template" } }, setup(l2, { slots: a2, attrs: i2 }) {
  let n2 = vue_cjs_prod.ref(null), u2 = K$1({ name: "SwitchLabel", props: { onClick() {
    !n2.value || (n2.value.click(), n2.value.focus({ preventScroll: true }));
  } } }), t2 = P$4({ name: "SwitchDescription" });
  return vue_cjs_prod.provide(b, { switchRef: n2, labelledby: u2, describedby: t2 }), () => k({ props: l2, slot: {}, slots: a2, attrs: i2, name: "SwitchGroup" });
} }), X = vue_cjs_prod.defineComponent({ name: "Switch", emits: { "update:modelValue": (l2) => true }, props: { as: { type: [Object, String], default: "button" }, modelValue: { type: Boolean, default: false }, name: { type: String, optional: true }, value: { type: String, optional: true } }, inheritAttrs: false, setup(l2, { emit: a2, attrs: i2, slots: n2, expose: u2 }) {
  let t2 = vue_cjs_prod.inject(b, null), p$12 = `headlessui-switch-${t$1()}`;
  function c2() {
    a2("update:modelValue", !l2.modelValue);
  }
  let h2 = vue_cjs_prod.ref(null), o$1 = t2 === null ? h2 : t2.switchRef, S2 = b$2(vue_cjs_prod.computed(() => ({ as: l2.as, type: i2.type })), o$1);
  u2({ el: o$1, $el: o$1 });
  function w2(e2) {
    e2.preventDefault(), c2();
  }
  function v2(e2) {
    e2.key === o.Space ? (e2.preventDefault(), c2()) : e2.key === o.Enter && p(e2.currentTarget);
  }
  function g2(e2) {
    e2.preventDefault();
  }
  return () => {
    let _a2 = l2, { name: e2, value: R2, modelValue: r2 } = _a2, k$1 = __objRest(_a2, ["name", "value", "modelValue"]), D2 = { checked: r2 }, K2 = { id: p$12, ref: o$1, role: "switch", type: S2.value, tabIndex: 0, "aria-checked": r2, "aria-labelledby": t2 == null ? void 0 : t2.labelledby.value, "aria-describedby": t2 == null ? void 0 : t2.describedby.value, onClick: w2, onKeyup: v2, onKeypress: g2 };
    return vue_cjs_prod.h(vue_cjs_prod.Fragment, [e2 != null && r2 != null ? vue_cjs_prod.h(l$2, O({ as: "input", type: "checkbox", hidden: true, readOnly: true, checked: r2, name: e2, value: R2 })) : null, k({ props: __spreadValues(__spreadValues(__spreadValues({}, i2), k$1), K2), slot: D2, attrs: i2, slots: n2, name: "Switch" })]);
  };
} }), Y$1 = T, Z$1 = S;
const _switch = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Switch: X,
  SwitchDescription: Z$1,
  SwitchGroup: W,
  SwitchLabel: Y$1
}, Symbol.toStringTag, { value: "Module" }));
let c = vue_cjs_prod.defineComponent({ props: { onFocus: { type: Function, required: true } }, setup(r2) {
  let t2 = vue_cjs_prod.ref(true);
  return () => t2.value ? vue_cjs_prod.h(l$2, { as: "button", type: "button", onFocus(o2) {
    o2.preventDefault();
    let e2, u2 = 50;
    function n2() {
      if (u2-- <= 0) {
        e2 && cancelAnimationFrame(e2);
        return;
      }
      if (r2.onFocus()) {
        t2.value = false, cancelAnimationFrame(e2);
        return;
      }
      e2 = requestAnimationFrame(n2);
    }
    e2 = requestAnimationFrame(n2);
  } }) : null;
} });
let H = Symbol("TabsContext");
function h(n2) {
  let u2 = vue_cjs_prod.inject(H, null);
  if (u2 === null) {
    let i2 = new Error(`<${n2} /> is missing a parent <TabGroup /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(i2, h), i2;
  }
  return u2;
}
let Y = vue_cjs_prod.defineComponent({ name: "TabGroup", emits: { change: (n2) => true }, props: { as: { type: [Object, String], default: "template" }, selectedIndex: { type: [Number], default: null }, defaultIndex: { type: [Number], default: 0 }, vertical: { type: [Boolean], default: false }, manual: { type: [Boolean], default: false } }, inheritAttrs: false, setup(n2, { slots: u2, attrs: i2, emit: f2 }) {
  let t$12 = vue_cjs_prod.ref(null), s2 = vue_cjs_prod.ref([]), l2 = vue_cjs_prod.ref([]), d2 = { selectedIndex: t$12, orientation: vue_cjs_prod.computed(() => n2.vertical ? "vertical" : "horizontal"), activation: vue_cjs_prod.computed(() => n2.manual ? "manual" : "auto"), tabs: s2, panels: l2, setSelectedIndex(e2) {
    t$12.value !== e2 && (t$12.value = e2, f2("change", e2));
  }, registerTab(e2) {
    s2.value.includes(e2) || s2.value.push(e2);
  }, unregisterTab(e2) {
    let r2 = s2.value.indexOf(e2);
    r2 !== -1 && s2.value.splice(r2, 1);
  }, registerPanel(e2) {
    l2.value.includes(e2) || l2.value.push(e2);
  }, unregisterPanel(e2) {
    let r2 = l2.value.indexOf(e2);
    r2 !== -1 && l2.value.splice(r2, 1);
  } };
  return vue_cjs_prod.provide(H, d2), vue_cjs_prod.watchEffect(() => {
    var v2;
    if (d2.tabs.value.length <= 0 || n2.selectedIndex === null && t$12.value !== null)
      return;
    let e2 = d2.tabs.value.map((p2) => t(p2)).filter(Boolean), r2 = e2.filter((p2) => !p2.hasAttribute("disabled")), o2 = (v2 = n2.selectedIndex) != null ? v2 : n2.defaultIndex;
    if (o2 < 0)
      t$12.value = e2.indexOf(r2[0]);
    else if (o2 > d2.tabs.value.length)
      t$12.value = e2.indexOf(r2[r2.length - 1]);
    else {
      let p2 = e2.slice(0, o2), a2 = [...e2.slice(o2), ...p2].find((c2) => r2.includes(c2));
      if (!a2)
        return;
      t$12.value = e2.indexOf(a2);
    }
  }), () => {
    let e2 = { selectedIndex: t$12.value };
    return vue_cjs_prod.h(vue_cjs_prod.Fragment, [vue_cjs_prod.h(c, { onFocus: () => {
      for (let r2 of s2.value) {
        let o2 = t(r2);
        if ((o2 == null ? void 0 : o2.tabIndex) === 0)
          return o2.focus(), true;
      }
      return false;
    } }), k({ props: __spreadValues(__spreadValues({}, i2), R$2(n2, ["selectedIndex", "defaultIndex", "manual", "vertical", "onChange"])), slot: e2, slots: u2, attrs: i2, name: "TabGroup" })]);
  };
} }), Z = vue_cjs_prod.defineComponent({ name: "TabList", props: { as: { type: [Object, String], default: "div" } }, setup(n2, { attrs: u2, slots: i2 }) {
  let f2 = h("TabList");
  return () => {
    let t2 = { selectedIndex: f2.selectedIndex.value }, s2 = { role: "tablist", "aria-orientation": f2.orientation.value };
    return k({ props: __spreadValues(__spreadValues({}, n2), s2), slot: t2, attrs: u2, slots: i2, name: "TabList" });
  };
} }), ee = vue_cjs_prod.defineComponent({ name: "Tab", props: { as: { type: [Object, String], default: "button" }, disabled: { type: [Boolean], default: false } }, setup(n2, { attrs: u2, slots: i2, expose: f2 }) {
  let t$2 = h("Tab"), s2 = `headlessui-tabs-tab-${t$1()}`, l2 = vue_cjs_prod.ref(null);
  f2({ el: l2, $el: l2 }), vue_cjs_prod.onMounted(() => t$2.registerTab(l2)), vue_cjs_prod.onUnmounted(() => t$2.unregisterTab(l2));
  let d2 = vue_cjs_prod.computed(() => t$2.tabs.value.indexOf(l2)), e2 = vue_cjs_prod.computed(() => d2.value === t$2.selectedIndex.value);
  function r2(a2) {
    let c2 = t$2.tabs.value.map((S2) => t(S2)).filter(Boolean);
    if (a2.key === o.Space || a2.key === o.Enter) {
      a2.preventDefault(), a2.stopPropagation(), t$2.setSelectedIndex(d2.value);
      return;
    }
    switch (a2.key) {
      case o.Home:
      case o.PageUp:
        return a2.preventDefault(), a2.stopPropagation(), H$3(c2, p$2.First);
      case o.End:
      case o.PageDown:
        return a2.preventDefault(), a2.stopPropagation(), H$3(c2, p$2.Last);
    }
    return u$4(t$2.orientation.value, { vertical() {
      if (a2.key === o.ArrowUp)
        return H$3(c2, p$2.Previous | p$2.WrapAround);
      if (a2.key === o.ArrowDown)
        return H$3(c2, p$2.Next | p$2.WrapAround);
    }, horizontal() {
      if (a2.key === o.ArrowLeft)
        return H$3(c2, p$2.Previous | p$2.WrapAround);
      if (a2.key === o.ArrowRight)
        return H$3(c2, p$2.Next | p$2.WrapAround);
    } });
  }
  function o$1() {
    var a2;
    (a2 = t(l2)) == null || a2.focus();
  }
  function v2() {
    var a2;
    n2.disabled || ((a2 = t(l2)) == null || a2.focus(), t$2.setSelectedIndex(d2.value));
  }
  function p2(a2) {
    a2.preventDefault();
  }
  let E2 = b$2(vue_cjs_prod.computed(() => ({ as: n2.as, type: u2.type })), l2);
  return () => {
    var S2, R2;
    let a2 = { selected: e2.value }, c2 = { ref: l2, onKeydown: r2, onFocus: t$2.activation.value === "manual" ? o$1 : v2, onMousedown: p2, onClick: v2, id: s2, role: "tab", type: E2.value, "aria-controls": (R2 = (S2 = t$2.panels.value[d2.value]) == null ? void 0 : S2.value) == null ? void 0 : R2.id, "aria-selected": e2.value, tabIndex: e2.value ? 0 : -1, disabled: n2.disabled ? true : void 0 };
    return k({ props: __spreadValues(__spreadValues({}, n2), c2), slot: a2, attrs: u2, slots: i2, name: "Tab" });
  };
} }), te = vue_cjs_prod.defineComponent({ name: "TabPanels", props: { as: { type: [Object, String], default: "div" } }, setup(n2, { slots: u2, attrs: i2 }) {
  let f2 = h("TabPanels");
  return () => {
    let t2 = { selectedIndex: f2.selectedIndex.value };
    return k({ props: n2, slot: t2, attrs: i2, slots: u2, name: "TabPanels" });
  };
} }), ae$1 = vue_cjs_prod.defineComponent({ name: "TabPanel", props: { as: { type: [Object, String], default: "div" }, static: { type: Boolean, default: false }, unmount: { type: Boolean, default: true } }, setup(n2, { attrs: u2, slots: i2, expose: f2 }) {
  let t2 = h("TabPanel"), s2 = `headlessui-tabs-panel-${t$1()}`, l2 = vue_cjs_prod.ref(null);
  f2({ el: l2, $el: l2 }), vue_cjs_prod.onMounted(() => t2.registerPanel(l2)), vue_cjs_prod.onUnmounted(() => t2.unregisterPanel(l2));
  let d2 = vue_cjs_prod.computed(() => t2.panels.value.indexOf(l2)), e2 = vue_cjs_prod.computed(() => d2.value === t2.selectedIndex.value);
  return () => {
    var v2, p2;
    let r2 = { selected: e2.value }, o2 = { ref: l2, id: s2, role: "tabpanel", "aria-labelledby": (p2 = (v2 = t2.tabs.value[d2.value]) == null ? void 0 : v2.value) == null ? void 0 : p2.id, tabIndex: e2.value ? 0 : -1 };
    return k({ props: __spreadValues(__spreadValues({}, n2), o2), slot: r2, attrs: u2, slots: i2, features: m$1.Static | m$1.RenderStrategy, visible: e2.value, name: "TabPanel" });
  };
} });
const tabs = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Tab: ee,
  TabGroup: Y,
  TabList: Z,
  TabPanel: ae$1,
  TabPanels: te
}, Symbol.toStringTag, { value: "Module" }));
function l(r2) {
  let e2 = { called: false };
  return (...t2) => {
    if (!e2.called)
      return e2.called = true, r2(...t2);
  };
}
function r() {
  let i2 = [], o2 = [], t2 = { enqueue(e2) {
    o2.push(e2);
  }, requestAnimationFrame(...e2) {
    let a2 = requestAnimationFrame(...e2);
    t2.add(() => cancelAnimationFrame(a2));
  }, nextFrame(...e2) {
    t2.requestAnimationFrame(() => {
      t2.requestAnimationFrame(...e2);
    });
  }, setTimeout(...e2) {
    let a2 = setTimeout(...e2);
    t2.add(() => clearTimeout(a2));
  }, add(e2) {
    i2.push(e2);
  }, dispose() {
    for (let e2 of i2.splice(0))
      e2();
  }, async workQueue() {
    for (let e2 of o2.splice(0))
      await e2();
  } };
  return t2;
}
function m(e2, ...t2) {
  e2 && t2.length > 0 && e2.classList.add(...t2);
}
function d$1(e2, ...t2) {
  e2 && t2.length > 0 && e2.classList.remove(...t2);
}
var g = ((i2) => (i2.Finished = "finished", i2.Cancelled = "cancelled", i2))(g || {});
function F$1(e2, t2) {
  let i2 = r();
  if (!e2)
    return i2.dispose;
  let { transitionDuration: n2, transitionDelay: a2 } = getComputedStyle(e2), [l2, s2] = [n2, a2].map((o2) => {
    let [u2 = 0] = o2.split(",").filter(Boolean).map((r2) => r2.includes("ms") ? parseFloat(r2) : parseFloat(r2) * 1e3).sort((r2, c2) => c2 - r2);
    return u2;
  });
  return l2 !== 0 ? i2.setTimeout(() => t2("finished"), l2 + s2) : t2("finished"), i2.add(() => t2("cancelled")), i2.dispose;
}
function L(e2, t2, i2, n2, a2, l$12) {
  let s2 = r(), o2 = l$12 !== void 0 ? l(l$12) : () => {
  };
  return d$1(e2, ...a2), m(e2, ...t2, ...i2), s2.nextFrame(() => {
    d$1(e2, ...i2), m(e2, ...n2), s2.add(F$1(e2, (u2) => (d$1(e2, ...n2, ...t2), m(e2, ...a2), o2(u2))));
  }), s2.add(() => d$1(e2, ...t2, ...i2, ...n2, ...a2)), s2.add(() => o2("cancelled")), s2.dispose;
}
const transition$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Reason: g,
  transition: L
}, Symbol.toStringTag, { value: "Module" }));
function d(e2 = "") {
  return e2.split(" ").filter((t2) => t2.trim().length > 1);
}
let F = Symbol("TransitionContext");
var ae = ((a2) => (a2.Visible = "visible", a2.Hidden = "hidden", a2))(ae || {});
function le() {
  return vue_cjs_prod.inject(F, null) !== null;
}
function ie() {
  let e2 = vue_cjs_prod.inject(F, null);
  if (e2 === null)
    throw new Error("A <TransitionChild /> is used but it is missing a parent <TransitionRoot />.");
  return e2;
}
function se() {
  let e2 = vue_cjs_prod.inject(R, null);
  if (e2 === null)
    throw new Error("A <TransitionChild /> is used but it is missing a parent <TransitionRoot />.");
  return e2;
}
let R = Symbol("NestingContext");
function w(e2) {
  return "children" in e2 ? w(e2.children) : e2.value.filter(({ state: t2 }) => t2 === "visible").length > 0;
}
function K(e2) {
  let t2 = vue_cjs_prod.ref([]), a2 = vue_cjs_prod.ref(false);
  vue_cjs_prod.onMounted(() => a2.value = true), vue_cjs_prod.onUnmounted(() => a2.value = false);
  function s2(r2, n2 = h$3.Hidden) {
    let l2 = t2.value.findIndex(({ id: i2 }) => i2 === r2);
    l2 !== -1 && (u$4(n2, { [h$3.Unmount]() {
      t2.value.splice(l2, 1);
    }, [h$3.Hidden]() {
      t2.value[l2].state = "hidden";
    } }), !w(t2) && a2.value && (e2 == null || e2()));
  }
  function v2(r2) {
    let n2 = t2.value.find(({ id: l2 }) => l2 === r2);
    return n2 ? n2.state !== "visible" && (n2.state = "visible") : t2.value.push({ id: r2, state: "visible" }), () => s2(r2, h$3.Unmount);
  }
  return { children: t2, register: v2, unregister: s2 };
}
let _ = m$1.RenderStrategy, oe = vue_cjs_prod.defineComponent({ props: { as: { type: [Object, String], default: "div" }, show: { type: [Boolean], default: null }, unmount: { type: [Boolean], default: true }, appear: { type: [Boolean], default: false }, enter: { type: [String], default: "" }, enterFrom: { type: [String], default: "" }, enterTo: { type: [String], default: "" }, entered: { type: [String], default: "" }, leave: { type: [String], default: "" }, leaveFrom: { type: [String], default: "" }, leaveTo: { type: [String], default: "" } }, emits: { beforeEnter: () => true, afterEnter: () => true, beforeLeave: () => true, afterLeave: () => true }, setup(e2, { emit: t$2, attrs: a2, slots: s2, expose: v2 }) {
  if (!le() && f$1())
    return () => vue_cjs_prod.h(fe, __spreadProps(__spreadValues({}, e2), { onBeforeEnter: () => t$2("beforeEnter"), onAfterEnter: () => t$2("afterEnter"), onBeforeLeave: () => t$2("beforeLeave"), onAfterLeave: () => t$2("afterLeave") }), s2);
  let r2 = vue_cjs_prod.ref(null), n2 = vue_cjs_prod.ref("visible"), l2 = vue_cjs_prod.computed(() => e2.unmount ? h$3.Unmount : h$3.Hidden);
  v2({ el: r2, $el: r2 });
  let { show: i2, appear: x2 } = ie(), { register: h2, unregister: p2 } = se(), B2 = { value: true }, m2 = t$1(), c2 = { value: false }, N2 = K(() => {
    c2.value || (n2.value = "hidden", p2(m2), t$2("afterLeave"));
  });
  vue_cjs_prod.onMounted(() => {
    let o2 = h2(m2);
    vue_cjs_prod.onUnmounted(o2);
  }), vue_cjs_prod.watchEffect(() => {
    if (l2.value === h$3.Hidden && !!m2) {
      if (i2 && n2.value !== "visible") {
        n2.value = "visible";
        return;
      }
      u$4(n2.value, { ["hidden"]: () => p2(m2), ["visible"]: () => h2(m2) });
    }
  });
  let k$1 = d(e2.enter), $ = d(e2.enterFrom), q = d(e2.enterTo), O2 = d(e2.entered), z2 = d(e2.leave), G2 = d(e2.leaveFrom), J2 = d(e2.leaveTo);
  vue_cjs_prod.onMounted(() => {
    vue_cjs_prod.watchEffect(() => {
      if (n2.value === "visible") {
        let o2 = t(r2);
        if (o2 instanceof Comment && o2.data === "")
          throw new Error("Did you forget to passthrough the `ref` to the actual DOM node?");
      }
    });
  });
  function Q2(o2) {
    let S2 = B2.value && !x2.value, u2 = t(r2);
    !u2 || !(u2 instanceof HTMLElement) || S2 || (c2.value = true, i2.value && t$2("beforeEnter"), i2.value || t$2("beforeLeave"), o2(i2.value ? L(u2, k$1, $, q, O2, (C2) => {
      c2.value = false, C2 === g.Finished && t$2("afterEnter");
    }) : L(u2, z2, G2, J2, O2, (C2) => {
      c2.value = false, C2 === g.Finished && (w(N2) || (n2.value = "hidden", p2(m2), t$2("afterLeave")));
    })));
  }
  return vue_cjs_prod.onMounted(() => {
    vue_cjs_prod.watch([i2], (o2, S2, u2) => {
      Q2(u2), B2.value = false;
    }, { immediate: true });
  }), vue_cjs_prod.provide(R, N2), c$3(vue_cjs_prod.computed(() => u$4(n2.value, { ["visible"]: l$3.Open, ["hidden"]: l$3.Closed }))), () => {
    let _a2 = e2, W2 = __objRest(_a2, ["appear", "show", "enter", "enterFrom", "enterTo", "entered", "leave", "leaveFrom", "leaveTo"]);
    return k({ props: __spreadValues(__spreadValues({}, W2), { ref: r2 }), slot: {}, slots: s2, attrs: a2, features: _, visible: n2.value === "visible", name: "TransitionChild" });
  };
} }), ue = oe, fe = vue_cjs_prod.defineComponent({ inheritAttrs: false, props: { as: { type: [Object, String], default: "div" }, show: { type: [Boolean], default: null }, unmount: { type: [Boolean], default: true }, appear: { type: [Boolean], default: false }, enter: { type: [String], default: "" }, enterFrom: { type: [String], default: "" }, enterTo: { type: [String], default: "" }, entered: { type: [String], default: "" }, leave: { type: [String], default: "" }, leaveFrom: { type: [String], default: "" }, leaveTo: { type: [String], default: "" } }, emits: { beforeEnter: () => true, afterEnter: () => true, beforeLeave: () => true, afterLeave: () => true }, setup(e2, { emit: t2, attrs: a2, slots: s2 }) {
  let v2 = p$4(), r2 = vue_cjs_prod.computed(() => e2.show === null && v2 !== null ? u$4(v2.value, { [l$3.Open]: true, [l$3.Closed]: false }) : e2.show);
  vue_cjs_prod.watchEffect(() => {
    if (![true, false].includes(r2.value))
      throw new Error('A <Transition /> is used but it is missing a `:show="true | false"` prop.');
  });
  let n2 = vue_cjs_prod.ref(r2.value ? "visible" : "hidden"), l2 = K(() => {
    n2.value = "hidden";
  }), i2 = vue_cjs_prod.ref(true), x2 = { show: r2, appear: vue_cjs_prod.computed(() => e2.appear || !i2.value) };
  return vue_cjs_prod.onMounted(() => {
    vue_cjs_prod.watchEffect(() => {
      i2.value = false, r2.value ? n2.value = "visible" : w(l2) || (n2.value = "hidden");
    });
  }), vue_cjs_prod.provide(R, l2), vue_cjs_prod.provide(F, x2), () => {
    let h2 = R$2(e2, ["show", "appear", "unmount"]), p2 = { unmount: e2.unmount };
    return k({ props: __spreadProps(__spreadValues({}, p2), { as: "template" }), slot: {}, slots: __spreadProps(__spreadValues({}, s2), { default: () => [vue_cjs_prod.h(ue, __spreadValues(__spreadValues(__spreadValues({ onBeforeEnter: () => t2("beforeEnter"), onAfterEnter: () => t2("afterEnter"), onBeforeLeave: () => t2("beforeLeave"), onAfterLeave: () => t2("afterLeave") }, a2), p2), h2), s2.default)] }), attrs: {}, features: _, visible: n2.value === "visible", name: "Transition" });
  };
} });
const transition = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  TransitionChild: oe,
  TransitionRoot: fe
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$2 = /* @__PURE__ */ vue_cjs_prod.defineComponent({
  __ssrInlineRender: true,
  setup(__props) {
    useRouter();
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<main${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "text-center text-teal-700 dark:text-gray-200" }, _attrs))}><div text-4xl>`);
      _push(serverRenderer.exports.ssrRenderComponent(vue_cjs_prod.unref(CarbonWarning), { class: "inline-block" }, null, _parent));
      _push(`</div><div>Not found</div><div><button type="button" class="text-sm m-3"> Back </button></div></main>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/404.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _404 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  "default": _sfc_main$2
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$1 = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  _push(`<p${serverRenderer.exports.ssrRenderAttrs(_attrs)}>Index</p>`);
}
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["ssrRender", _sfc_ssrRender]]);
const index$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  "default": index
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main = {
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { data: news, pending, error } = ([__temp, __restore] = vue_cjs_prod.withAsyncContext(() => useFetch("https://newsapi.org/v2/everything?q=Apple&from=2022-05-31&sortBy=popularity&apiKey=e34eccb2fd5f440b8edad44ff3ca69be")), __temp = await __temp, __restore(), __temp);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_CardList = __nuxt_component_0$1;
      _push(`<div${serverRenderer.exports.ssrRenderAttrs(_attrs)}>`);
      if (vue_cjs_prod.unref(pending)) {
        _push(`<p> Loading.... </p>`);
      } else if (vue_cjs_prod.unref(error)) {
        _push(`<p>${serverRenderer.exports.ssrInterpolate(vue_cjs_prod.unref(error))}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="w-9/12 grid grid-cols-1 gap-4 m-auto p-3"><!--[-->`);
      serverRenderer.exports.ssrRenderList(vue_cjs_prod.unref(news).articles, (article) => {
        _push(serverRenderer.exports.ssrRenderComponent(_component_CardList, {
          key: article.id,
          product: article
        }, null, _parent));
      });
      _push(`<!--]--></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/my.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const my = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  "default": _sfc_main
}, Symbol.toStringTag, { value: "Module" }));

export { entry$1 as default };
//# sourceMappingURL=server.mjs.map
