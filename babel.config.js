module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // Some dependencies ship ESM that reads `import.meta.env` (zustand's middleware
          // does). Metro's web bundle is a classic script, so an untransformed
          // `import.meta` is a SyntaxError and the page renders blank.
          unstable_transformImportMeta: true,
        },
      ],
    ],
  };
};
