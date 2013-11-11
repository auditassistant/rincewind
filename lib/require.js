var readFileSync = require('fs').readFileSync
var parse = require('./parse')
var path = require('path')

var cache = {}

var load = module.exports = function(file){
  var dir = path.dirname(file)

  if (!cache[file]){
    cache[file] = parse(readFileSync(file, 'utf8'))
    var views = cache[file].views = cache[file].views || {}
    var requires = cache[file].requires
    requires&&Object.keys(requires).forEach(function(key){
      if (!views[key]){
        var ext = path.extname(requires[key])
        var subFile = path.resolve(dir, requires[key])
        if (ext == '.html'){
          views[key] = load(subFile)
        } else {
          views[key] = {require: subFile}
        }
      }
    })
  }
  return cache[file]
}