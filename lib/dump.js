var path = require('path')

module.exports = dump

function dump(view, dirname){
  if (view){

    if (typeof view.getCompiledView === 'function'){
      view = view.getCompiledView()
    }

    if (view.require){
      return 'require(' + JSON.stringify(getRelative(dirname, view.require)) + ')'
    } else {
      return '{' + Object.keys(view).filter(function(key){
        return key !== 'requires'
      }).map(function(key){
        if (key === 'views'){
          var views = view.views
          return '"views": {' + Object.keys(views).map(function(viewKey){
            return JSON.stringify(viewKey) + ': ' + dump(views[viewKey], dirname)
          }).join(',') + '}'
        } else if (key === 'resources'){
          var resources = view.resources
          return '"resources": {' + Object.keys(resources).map(function(k){
            var obj = resources[k]

            // make path relative to dirname
            if (resources[k] instanceof Object){
              obj = {
                key: obj.key,
                path: getRelative(dirname, obj.path)
              }
            }

            return JSON.stringify(k) + ': ' + JSON.stringify(obj)
          }).join(',') + '}'
        } else {
          return JSON.stringify(key) + ': ' + JSON.stringify(view[key])
        }
      }).join(', ') + '}'
    }
  }
}

function getRelative(dirname, filepath){
  return './' + path.relative(dirname, filepath)
}