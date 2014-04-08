module.exports = function getLocals(view){
  var result = {}
  for (var k in view.views){
    if (k in view.views){
      var v = view.views[k]
      if (v.require){
        result[k] = require(v.require)
      }
    }
  }
  return result
}