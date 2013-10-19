var parse = require('./lib/parse')
var render = require('./lib/render')

module.exports = function(html, options){
  //options: name, master, views
  
  var view = html

  if (typeof options == 'string'){
    options = {name: options}
  } else if (!options) {
    options = {}
  }

  if (typeof html == 'string'){
    view = parse(html, options.name || 't')
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
            parent: templateContext.source,
            parentOptions: templateContext
          })

          if (template.contextAs){
            current.override = mergeClone(current.override)
            current.override[template.contextAs] = object
          }

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
            override: {},
            parentOptions: templateContext
          }))
        }
        
      }
    }

    var rootTemplate = view[view.$root]
    var result = render(mergeClone(options, {
      template: rootTemplate,
      bindingValues: getBindValuesFor(rootTemplate, get, options),
      formatters: options.formatters || {},
      contentStack: [],
      handleEntity: handleEntity
    }))

    result.toHtml = function(){
      return getHtml(result)
    }

    return result
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

  result.setMaster = function(master){
    var name = null
    var result = []

    if (typeof master == 'string'){
      name = master
    } else if (typeof master == 'function') {
      var v = master.getView()
      name = v.$root
      result = merge(v)
    } else {
      name = master.$root
      result = merge(master)
    }

    var rootTemplate = view[view.$root]
    var placeholder = ['t:placeholder', {_view: name}, rootTemplate.elements]
    rootTemplate.elements = [placeholder]
    rootTemplate.subViews.push(name)
    view.$referencedViews.push(name)

    return result
  }

  result.addView = function(html, name){

    if (typeof html == 'string'){
      html = parse(html, name)
    } else if (typeof html == 'function'){
      html = html.getView()
    }

    return merge(html)
  }

  result.getReferencedViews = function(){
    return view.$referencedViews
  }

  result.getView = function(){ return view }


  if (options.views){
    options.views.forEach(function(view){
      result.addView(view)
    })
  }

  if (options.master){
    result.setMaster(options.master)
  }

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

function getHtml(elements){
  return elements.map(function(element){
    return element.outerHTML
  }).join('')
}