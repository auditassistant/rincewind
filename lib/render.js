var checkFilter = require('json-filter')

var render = module.exports = function(parts, context){
  var result = ''
  for (var i=0;i<parts.length;i++){
    var part = parts[i]

    if (typeof part == 'string'){ // default
      result += part

    } else if (part.r){ // repeater

      var collection = context.get(part.r)
      if (Array.isArray(collection)){
        for (var x=0;x<collection.length;x++){
          var newContext = mergeClone(context)

          newContext.collection = collection
          newContext.source = collection[x]

          if (part.as){
            newContext.override = mergeClone(newContext.override)
            newContext.override[part.as] = newContext.source
          }

          if (part.f){ // handle filters (if, unless, when)
            if (!queryFilter(part.f, newContext)){
              continue;
            }
          }

          result += render(part.c, newContext)
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
        var newContext = mergeClone(context)
        newContext.content = content

        if (part.q){
          newContext.source = context.get(part.q)
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
        result += content
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
  if (filter){
    var object = {}
    Object.keys(filter).forEach(function(key){
      object[key] = context.get(key)
    })
    return checkFilter(object, filter)
  } else {
    return true
  }
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