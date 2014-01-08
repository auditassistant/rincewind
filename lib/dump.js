var path = require('path')

module.exports = dump

function dump(view, dirname){
  if (view){

    if (typeof view.getCompiledView === 'function'){
      view = view.getCompiledView()
    }

    if (view.require){
      return 'require(' + JSON.stringify('./' + path.relative(dirname, view.require)) + ')'
    } else {
      return '{' + Object.keys(view).filter(function(key){
        return key !== 'requires'
      }).map(function(key){
        if (key === 'views'){
          var views = view.views
          return '"views": {' + Object.keys(views).map(function(viewKey){
            return JSON.stringify(viewKey) + ': ' + dump(views[viewKey], dirname)
          }).join(',') + '}'
        } else {
          return JSON.stringify(key) + ': ' + JSON.stringify(view[key])
        }
      }).join(', ') + '}'
    }
  }
}