var sax = require('sax')
var stripAttributes = [
  't:repeat', 't:bind', 't:when', 't:if', 't:unless', 't:format', 't:by', 't:view', 't:content', 't:context', 't:as'
]

module.exports = function(rawView, viewName){
  var templateCount = 1
    , stack = createKeyStack() 
    , depth = 0
    , discard = false
  
  viewName = viewName || 't'

  var result = {}
  var view = {
    ref: viewName,
    elements: [],
    sub: [],
    subBindings: [],
    subViews: [],
    bindings: [],
    _isView: true
  }
  result[viewName] = view
  result.$referencedViews = []
  result.$root = viewName
  
  var parser = sax.parser(false, {lowercasetags: true, normalize: true})
  
  stack.push('elements', view.elements)
  stack.push('template', view)
  
  parser.onopentag = function(node){
    depth++
    
    if (elementIsTemplate(node)){

      setAdd(stack.get('template').subBindings, node.attributes['t:repeat'])

      var template = createTemplate(node)
      template.ref = viewName + ':' + templateCount++
      
      result[template.ref] = template
      
      stack.get('template').sub.push(template.ref)
      stack.get('elements').push({template: template.ref})
      
      
      // push template and elements
      stack.push('templateDepth', depth)
      stack.push('template', template)
      stack.push('elements', template.elements)
      
    }
    
    if (elementIsFilter(node)){
      
      // push filter
      stack.push('filter', node.attributes)
      
    } 
      
    var element = createElement(node, {filter: stack.get('filter')})
    stack.get('elements').push(element)
    
    // add bindings to template
    if (element[1]._bind){
      setAdd(stack.get('template').bindings, element[1]._bind)
    }
    if (element[1]._filters){
      setAddAll(stack.get('template').bindings, Object.keys(element[1]._filters))
    }
    Object.keys(node.attributes).forEach(function(key){
      if (key.slice(0,7) === 't:bind:'){
        setAdd(stack.get('template').bindings, node.attributes[key])
      }
    })
    
    if (element[1]._view){
      setAdd(result.$referencedViews, element[1]._view)
      setAdd(stack.get('template').subViews, element[1]._view)
    }

    
    // push elements
    stack.push('elements', element[2] || []) // if no element collection, open a disconnected dump for items


  }
  
  parser.onclosetag = function(tag){
    var isTemplate = (stack.get('templateDepth') === depth)
      , isElement = (tag !== 'filter')
      , isFilter = (tag === 'filter')
    
    if (isTemplate){
      stack.pop('template')
      stack.pop('templateDepth')
      stack.pop('elements')
    }
    
    if (!isFilter){
      stack.pop('elements')
    }
    
    depth--
  }
  
  parser.ontext = function(text){
    stack.get('elements').push(text)
  }
  
  parser.onscript = function(text){
    stack.get('elements').push(text)
  }
  
  parser.write(rawView).close()
  
  return result
}

function elementIsTemplate(node){
  return !!node.attributes['t:repeat']
}

function elementIsFilter(node){
  return !!node.attributes['t:by']
}

function createTemplate(node){
  var template = {
    query: node.attributes['t:repeat'] || null,
    sub: [],
    bindings: [],
    subBindings: [],
    subViews: [],
    elements: []
  }

  if (node.attributes['t:as']){
    template.contextAs = node.attributes['t:as']
  }
  
  return template
}

function checkAttributeAllowed(attr){
  return !~stripAttributes.indexOf(attr) && attr.slice(0,7) !== 't:bind:'
}

function createElement(node, options){
  // options: filter
  
  var bound = false
  var newAttributes = {}
  
  Object.keys(node.attributes).forEach(function(key){
    if (key === 't:behavior'){
      newAttributes['data-behavior'] = node.attributes[key]
    } else if (checkAttributeAllowed(key)){
      newAttributes[key] = node.attributes[key]
    } else if (key.slice(0,7) === 't:bind:'){
      newAttributes._bindAttributes = newAttributes._bindAttributes || {}
      newAttributes._bindAttributes[key.slice(7)] = node.attributes[key]      
    }
  })
  
  var element = [node.name, newAttributes]

  // handle directly bound elements
  if (node.attributes['t:bind']){
    bound = true
    element[1]._bind = node.attributes['t:bind']
  }
  
  if (node.attributes['t:view']){
    element[1]._view = node.attributes['t:view']
  }
  
  if (node.attributes.hasOwnProperty('t:content')){
    element[1]._content = true
  }
  
  if (node.attributes['t:format']){
    element[1]._format = node.attributes['t:format']
  }
  
  // data by/when filter
  if (node.attributes['t:when'] && (node.attributes['t:by'] || (options.filter && options.filter['t:by']))){
    var filterParam = node.attributes['t:by'] || options.filter['t:by']
    
    element[1]['_filters'] = element[1]['_filters'] || {}
    
    // check to see if multimatch t:when
    if (node.attributes['t:when'].indexOf('|') < 0){
      element[1]['_filters'][filterParam] = node.attributes['t:when']
    } else {
      element[1]['_filters'][filterParam] = {$only: node.attributes['t:when'].split('|')} 
    }
    
  }
  
  // data if filter
  if (node.attributes['t:if']){    
    element[1]['_filters'] = element[1]['_filters'] || {}
    element[1]['_filters'][node.attributes['t:if']] = {$present: true}
  }
  
  // data unless filter
  if (node.attributes['t:unless']){    
    element[1]['_filters'] = element[1]['_filters'] || {}
    element[1]['_filters'][node.attributes['t:unless']] = {$present: false}
  }
  
  
  // if the element has been bound we don't want to keep the child elements
  if (!bound){
    element.push([])
  }

  return element
}

function setAdd(array, item){
  if (array.indexOf(item) < 0){
    array.push(item)
  }
}
function setAddAll(array, items){
  items.forEach(function(item){
    setAdd(array, item)
  })
}


function createKeyStack(){
  var stacks = {}
    , current = {}
    
  var keyStack = {
    push: function(param, value){
      (stacks[param] = stacks[param] || []).push(current[param])
      current[param] = value
    },
    pop: function(param){
      if (stacks[param]){
        current[param] = stacks[param].pop()
      }
      
      return current[param]
    },
    get: function(param){
      return current[param]
    },
    count: function(param){
      stacks[param] && (stacks[param].length + 1) || 0
    }
  }
  return keyStack
}