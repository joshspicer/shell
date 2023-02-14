/**
 * Webpack 5 blew out images with a change. Temporary fix until they patch it
 * https://github.com/nrwl/nx/issues/14378#issuecomment-1417523527
 */
const withSvgFix = (config) => {
  config.module?.rules?.forEach((rule) => {
    if (typeof rule === 'string') {
      return;
    }

    // Make sure all appropriate files are being processed by file-loader
    if (typeof rule.loader !== 'undefined' && /file-loader/.test(rule.loader)) {
      rule.test = /\.(eot|cur|jpg|png|webp|gif|otf|ttf|woff|woff2|ani)$/; // Excluding `svg`
      rule.type = 'javascript/auto'; // Fixing images
    }

    // Inject the proper override for svg file rules. Leave the rest alone to prevent breaking something else
    if (rule.test instanceof RegExp && rule.test.test('.svg')) {
      rule.use = ['@svgr/webpack', 'url-loader'];
    }
  });
};

module.exports = {
  stories: [],
  addons: ['@storybook/addon-essentials'],
  // uncomment the property below if you want to apply some webpack config globally
  webpackFinal: async (config, { configType }) => {
    // Make whatever fine-grained changes you need that should apply to all storybook configs
    withSvgFix(config);

    // Return the altered config
    return config;
  },
};
