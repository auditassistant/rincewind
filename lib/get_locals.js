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

  if (view.resources){
    for (var k in view.resources){
      if (k in view.resources){
        result[k] = view.resources[k]
      }
    }
  }

  return result
}