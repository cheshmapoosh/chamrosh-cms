const { defaultsDeep } = require("lodash/fp");

const defaults = {
  origin: "*",
  maxAge: 31536000,
  credentials: true,
  expose: true,
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
  headers: ["Content-Type", "Authorization", "Origin", "Accept"],
  keepHeadersOnError: false,
};

module.exports = (config) => {
  return async (ctx, next) => {
    const headersSet = {};

    function set(key, value) {
      ctx.set(key, value);
      headersSet[key] = value;
    }
    
    const {
      origin,
      exposeHeaders,
      maxAge,
      credentials,
      allowMethods,
      allowHeaders,
      keepHeadersOnError,
    } = defaultsDeep(defaults, config);
    if (ctx.method !== "OPTIONS") {
      set("Access-Control-Allow-Origin", origin);
      if (credentials === true) {
        set("Access-Control-Allow-Credentials", "true");
      }
      if (exposeHeaders) {
        set("Access-Control-Expose-Headers", exposeHeaders);
      }
      if (!keepHeadersOnError) {
        return await next();
      }
      try {
        return await next();
      } catch (err) {
        const errHeadersSet = err.headers || {};
        const varyWithOrigin = vary.append(
          errHeadersSet.vary || errHeadersSet.Vary || "",
          "Origin"
        );
        delete errHeadersSet.Vary;
        err.headers = {
          ...errHeadersSet,
          ...headersSet,
          ...{ vary: varyWithOrigin },
        };
        throw err;
      }
    } else {
      // If there is no Access-Control-Request-Method header or if parsing failed,
      // do not set any additional headers and terminate this set of steps.
      // The request is outside the scope of this specification.
      //   if (!ctx.get("Access-Control-Request-Method")) {
      //     // this not preflight request, ignore it
      //     return await next();
      //   }
      ctx.set("Access-Control-Allow-Origin", origin);
      if (credentials === true) {
        ctx.set("Access-Control-Allow-Credentials", "true");
      }
      if (maxAge) {
        ctx.set("Access-Control-Max-Age", maxAge);
      }
      if (allowMethods) {
        ctx.set("Access-Control-Allow-Methods", allowMethods);
      }
      let headers = allowHeaders;
      if (!headers) {
        headers = ctx.get("Access-Control-Request-Headers");
      }
      if (headers) {
        ctx.set("Access-Control-Allow-Headers", headers);
      }
      ctx.status = 204;
    }
  };
};
