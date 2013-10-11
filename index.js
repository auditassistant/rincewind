var parse = require('./lib/parse')
var render = require('./lib/render')

module.exports = function(html, handleView){
  var view = html
  if (typeof html == 'string'){
    view = parse(html)
  }

  var result = function(get, options){
    // options: formatters, includeMeta

    options = options || {}

    function handleEntity(entity, templateContext){

      if (entity.template){

        var template = view[entity.template]
        var collection = templateContext.bindingValues[template.query] || []

        return collection.map(function(object, i){

          var current = mergeClone(templateContext, {
            collection: collection,
            index: i,
            source: object,
            template: template,
            parentOptions: templateContext
          })

          current.bindingValues = getBindValuesFor(template, get, current)

          return render(current)
        })

      } else if (entity.view){

        var template = view[entity.view]

        if (template){
          return render(mergeClone(templateContext, {
            viewName: entity.view,
            template: template,
            bindingValues: getBindValuesFor(template, get, templateContext),
            parentOptions: templateContext
          }))
        } else if (handleView){
          return handleView(entity.view, templateContext)
        }
      }
    }

    var rootTemplate = view[view.$root]
    return render(mergeClone(options, {
      template: rootTemplate,
      bindingValues: getBindValuesFor(rootTemplate, get, options),
      formatters: options.formatters || {},
      contentStack: [],
      handleEntity: handleEntity
    }))

  }

  function merge(subView){
    Object.keys(subView).forEach(function(key){
      if (key.charAt(0) != '$'){
        view[key] = subView[key]
      }
    })

    var newViews = []
    if (subView.$referencedViews){
      subView.$referencedViews.forEach(function(name){
        if (!~view.$referencedViews.indexOf(name)){
          view.$referencedViews.push(name)
          newViews.push(name)
        }
      })
    }
    return newViews
  }

  result.setMaster = function(name){
    var rootTemplate = view[view.$root]
    var placeholder = ['t:placeholder', {_view: name}, rootTemplate.elements]
    rootTemplate.elements = [placeholder]
    rootTemplate.subViews.push(name)
    view.$referencedViews.push(name)
  }

  result.addView = function(html, name){

    if (typeof html == 'string'){
      html = parse(html, name)
    }

    return merge(html)
  }

  result.getReferencedViews = function(){
    return view.$referencedViews
  }

  result.getView = function(){ return view }

  return result
}


function getBindValuesFor(template, get, options){
  var result = {}

  template.bindings.forEach(function(binding){
    result[binding] = get(binding, options)
  })

  template.subBindings.forEach(function(binding){
    result[binding] = get(binding, options)
  })

  return result
}

function mergeClone(){
  var result = {}
  for (var i=0;i<arguments.length;i++){
    var obj = arguments[i]
    if (obj){
      Object.keys(obj).forEach(function(key){
        result[key] = obj[key]
      })
    }
  }
  return result
}