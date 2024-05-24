const { defineConfig } = require('@vue/cli-service')
const { config } = require('./config.js')

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === 'production' ? config.baseDir : '/',
  outputDir: '/dist'
});


