module.exports = {
  plugins: [
    function () {
      return {
        visitor: {
          MetaProperty(path) {
            path.replaceWithSourceString('process')
          },
        },
      }
    },
  ],
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
    ['@babel/preset-react', { "runtime": "automatic" }],
    ['jest'],
  ],
};
