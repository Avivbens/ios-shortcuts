module.exports = process.env.CI
    ? {
          '**/*.(js|ts|mts|mjs|cjs|cts|json|yaml)': 'npm run lint',
      }
    : {
          '**/*.(js|ts|mts|mjs|cjs|cts|json|yaml)': 'npm run lint:fix',
      }
