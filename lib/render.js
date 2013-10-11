var h = require('hyperscript')
var checkFilter = require('json-filter')

module.exports = function(templateContext){
  return render(templateContext.template.elements, templateContext)
}

function render(elements, templateContext){
  var result = []

  elements.forEach(function(element){
    if (Array.isArray(element)){

      // handle element
      result.push(renderElement(element, templateContext))

    } else if (typeof element == 'string' || typeof element == 'number'){

      // handle text element
      result.push(element)

    } else if (element){

      // handle entity
      if (templateContext.handleEntity){
        var e = templateContext.handleEntity(element, templateContext)
        e && result.push(e)

        if (templateContext.includeMeta && element.template){
          result.push(document.createComment(element.template))
        }
      }

    }
  })

  return result
}

function renderElement(element, templateContext){

  // conditional element (back out if false)
  if (!queryFilter(element[1]._filters, templateContext)){
    return null
  }

  var content = null

  var attributes = getAttributes(element[1], templateContext)

  // get inner content
  var query = element[1]._bind
  if (query){
    var format = element[1]._format
    var formatter = templateContext[format] || defaultFormatter
    var value = templateContext.bindingValues[query]
    content = formatter(value, templateContext)
  } else if (element[1]._content){
    content = last(templateContext.contentStack) || []
  } else {
    content = render(element[2], templateContext, node)
  }

  // handle views
  if (element[1]._view){
    templateContext.contentStack.push(content)
    content = templateContext.handleEntity({view: element[1]._view}, templateContext) || []
    templateContext.contentStack.pop()
  }

  // handle placeholders
  if (element[0] == 't:placeholder'){

    if (Object.keys(attributes).length){
      content.$parentAttributes = attributes
    }
    return content

  } else {
    var node = h(element[0], attributes)
    appendTo(content, node)
    return node
  }

}

function defaultFormatter(value, templateContext){
  if (typeof value == 'string' || typeof value == 'number'){
    return value.toString()
  } else if (Array.isArray(value)){
    return value.join(', ')
  } else {
    return ''
  }
}

function queryFilter(filter, templateContext){
  if (filter){
    var object = {}
    Object.keys(filter).forEach(function(key){
      object[key] = templateContext.bindingValues[key]
    })
    return checkFilter(object, filter)
  } else {
    return true
  }
}

function getAttributes(attributes, templateContext){
  var result = {}

  Object.keys(attributes).forEach(function(key){
    if (key.charAt(0) != '_'){
      result[key] = attributes[key]
    }
  })

  if (attributes._bindAttributes){
    Object.keys(attributes._bindAttributes).forEach(function(key){
      var query = attributes._bindAttributes[key]
      result[key] = templateContext.bindingValues[query]
    })
  }

  return result
}

function appendTo(nodes, to){
  if (nodes){
    if (Array.isArray(nodes)){
      
      // insert carried placeholder attributes
      if (nodes.$parentAttributes){
        var attributes = nodes.$parentAttributes
        Object.keys(attributes).forEach(function(key){
          to.setAttribute(key, attributes[key])
        })
      }

      nodes.forEach(function(node){
        appendTo(node, to)
      })

    } else if (typeof nodes == 'string' || typeof nodes == 'boolean' || typeof nodes == 'number') {
      to.appendChild(document.createTextNode(nodes.toString()))
    } else {
      to.appendChild(nodes)
    }
  }
}