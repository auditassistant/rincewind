var readFileSync = require('fs').readFileSync
var parse = require('./parse')
var path = require('path')
var resolve = require('resolve')

var getRelativePath = require('path').relative

module.exports = load

var globalCache = {}

function load(file, opts){

  var cache = globalCache
  if (opts && opts.cache === false){
    cache = {}
  } else if (opts && opts.cache instanceof Object){
    cache = opts.cache
  }

  var dir = path.dirname(file)

  if (!cache[file]){
    cache[file] = parse(readFileSync(file, 'utf8'))
    var views = cache[file].views = cache[file].views || {}
    var requires = cache[file].requires
    requires&&Object.keys(requires).forEach(function(key){
      if (!views[key]){
        var ext = path.extname(requires[key])
        var subFile = resolve.sync(requires[key], {basedir: dir})
        if (ext == '.html'){
          views[key] = load(subFile, {cache: cache})
        } else {
          views[key] = {require: subFile}
        }
      }
    })

  }
  return cache[file]
}