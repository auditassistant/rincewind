var render = require('./lib/render')
var requireView = require('./lib/require')
var parse = require('./lib/parse')

module.exports = function(view, opts){

  view = getView(view, opts)

  var func = function(context){
    context = context || {}
    context.views = view.views
    return render(view.c, context)
  }

  func.getCompiledView = function(){
    return view
  }

  func.getExternal = function(){
    var externalRequires = []
    addExt(view, externalRequires)
    return externalRequires
  }

  func.addView = function(name, v){
    view.views = view.views || {}
    view.views[name] = getView(v)
  }

  return func
}

function addExt(template, externalRefs){
  Object.keys(template.views).forEach(function(key){
    var view = template.views[key]
    if (view.require){
      if (!~externalRefs.indexOf(view.require)){
        externalRefs.push(view.require)
      }
    } else {
      addExt(view, externalRefs) 
    }
  })
}

function getView(view, opts){
  if (typeof view == 'string'){
    view = requireView(view, opts)
  } else if (view.parse) {
    view = parse(view.parse)
  }
  return view
}