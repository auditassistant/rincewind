var checkFilter = require('json-filter')

module.exports = function render(parts, context){
  var result = ''
  for (var i=0;i<parts.length;i++){
    var part = parts[i]

    if (typeof part == 'string'){ // default
      result += part

    } else if (part.r){ // repeater

      var collection = context.get(part.r)
      var collectionContext = copy(context)
      collectionContext.source = collection
      collectionContext.query = part.r 
      collectionContext.parentContext = context

      if (Array.isArray(collection)){
        for (var x=0;x<collection.length;x++){
          var newContext = copy(context)

          newContext.collection = collection
          newContext.source = collection[x]
          newContext.parent = context.source
          newContext.query = '[' + x + ']'
          newContext.parentContext = collectionContext

          if (part.as){
            newContext.override = copy(newContext.override)
            newContext.override[part.as] = newContext.source
          }

          if (part.f){ // handle filters (if, unless, when)
            if (!queryFilter(part.f, newContext)){
              continue;
            }
          }

          if (part.v){
            result += render([{c: part.c,  v: part.v}], newContext)
          } else {
            result += render(part.c, newContext)
          }

        }
      }

    } else {

      if (part.f){ // handle filters (if, unless, when)
        if (!queryFilter(part.f, context)){
          continue;
        }
      }

      // inner content
      var content = ''
      if (part.c){
        content = render(part.c, context)
      } else if (part.vc){
        content = context.content
      } else if (part.q){
        var value = context.get(part.q)
        content = format(value, part.e)
      }


      if (part.v){ // view
        var newContext = copy(context)
        newContext.content = content

        if (part.q){
          newContext.parentContext = context
          newContext.source = context.get(part.q)
          newContext.query = part.q
          newContext.parent = context.source
        }

        var view = context.views[part.v]
        if (view){
          if (typeof view == 'function'){
            result += view(newContext)
          } else if (view.require){
            result += require(view.require)(newContext)
          } else {
            newContext.views = view.views
            result += render(view.c, newContext)
          }
        }

      } else {
        result += content || ''
      }
    } 
  }
  return result
}

function format(value, type){
  if (typeof value == 'string' || typeof value == 'number'){
    return escapeHTML(value.toString(), type)
  } else if (Array.isArray(value)){
    return escapeHTML(value.join(', '), type)
  } else {
    return ''
  }
}

function escapeHTML(s, type) {
  if (type !== false){
    var result = String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    if (type === 'attr'){
      result = result.replace(/"/g, '&quot;')
    }
    return result
  } else {
    return s
  }
}

function queryFilter(filter, context){
  var result = true
  if (filter){
    var object = {}

    var keys = Object.keys(filter)
    for (var i=0,l=keys.length;i<l;i++){
      var key = keys[i]
      object[key] = context.get(key)
    }

    result = checkFilter(object, filter)
  }

  return result
}

function copy(obj){
  var result = {}
  if (obj){
    for (var key in obj){
      if (key in obj){
        result[key] = obj[key]
      }
    }
  }
  return result
}