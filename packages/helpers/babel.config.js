module.exports = {
  presets: [
    ['jest'],
    ['@babel/preset-react', { "runtime": "automatic" }],
    '@babel/preset-typescript',
    ['@babel/preset-env', { targets: { node: 'current' } }]
  ],
};
