module.exports = [
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'global::allowAllCors',
  {
    name: 'strapi::poweredBy',
    config: {
      poweredBy: "Chamrosh Co"
    }

  },
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
