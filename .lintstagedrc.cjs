module.exports = {
  '*.{ts,cjs,js,json}': 'pnpm exec eslint --cache --fix',
  '**/*': 'pnpm exec prettier --cache --write --ignore-unknown',
};
