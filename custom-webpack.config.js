const webpack = require('webpack');
// eslint-disable-next-line import/no-extraneous-dependencies
const { merge } = require('webpack-merge');
const nrwlConfig = require('@nrwl/react/plugins/webpack.js');

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

module.exports = (config) => {
  nrwlConfig(config);

  const websocketUrl = `wss://${process.env.NX_CODESPACE_NAME}-4200.${process.env.NX_GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}/ws`;
  withSvgFix(config);

  return merge(config, {
    plugins: [
      new webpack.EnvironmentPlugin({
        NX_CODESPACE_NAME: null,
        NX_GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN: null,
      }),
    ],
    devServer: {
      allowedHosts: 'all',
      client: {
        webSocketURL: websocketUrl,
      },
    },
  });
};
