var sax = require('sax')

var selfClosingTags = [ 'meta', 'img', 'link', 'input', 'area', 'base', 'col', 'br', 'hr' ]

module.exports = function(rawView){
  var parser = sax.parser(false, {lowercasetags: true, normalize: true})

  var result = {c: []}

  // stack
  var current = result
  var depth = 0
  var stack = []
  var depthStack = []
  function stepIn(inside){
    var inner = {c: []}
    current.c.push(inner)
    stack.push(current)
    if (inside){
      depthStack.push(depth + 'in')
    } else {
      depthStack.push(depth)
    }
    current = inner
  }
  function stepOut(){
    depthStack.pop()
    current = stack.pop()
  }

  // by stack
  var byDepthStack = []
  var byStack = []
  var currentBy = null
  function pushBy(query){
    byStack.push(currentBy)
    byDepthStack.push(depth)
    currentBy = query
  }
  function popBy(query){
    byDepthStack.pop()
    currentBy = byStack.pop()
  }


  function write(html){
    if (typeof html == 'string'){
      var last = current.c[current.c.length-1]
      if (typeof last == 'string'){
        current.c[current.c.length-1] += html
      } else {
        current.c.push(html)
      }
    } else {
      current.c.push(html)
    }
  }
  
  parser.ondoctype = function(doctype){
    write('<!doctype ' + doctype + '>')
  }

  parser.onopentag = function(node){
    depth+=1

    if (node.attributes['t:by']){
      pushBy(node.attributes['t:by'])
    }

    if (isBlock(node)){

      stepIn()

      if (node.attributes['t:repeat']){
        current['r'] = node.attributes['t:repeat']
      }

      if (node.attributes['t:as']){
        current.as = node.attributes['t:as']
      }

      if (node.attributes['t:view']){
        current['v'] = node.attributes['t:view']
      }

      if (node.attributes['t:if']){
        current['f'] = current['f'] || {}
        current['f'][node.attributes['t:if']] = {$present: true}
      }

      if (node.attributes['t:unless']){
        current['f'] = current['f'] || {}
        current['f'][node.attributes['t:unless']] = {$present: false}
      }

      if (node.attributes['t:when'] && currentBy){
        current['f'] = current['f'] || {}

        if (node.attributes['t:when'].indexOf('|') < 0){
          current['f'][currentBy] = node.attributes['t:when']
        } else {
          current['f'][currentBy] = {$only: node.attributes['t:when'].split('|')} 
        }
      }
    }

    if (!isPlaceholder(node)){
      write('<' + node.name)
      Object.keys(node.attributes).forEach(function(key){
        if (key.slice(0,7) === 't:bind:'){
          var k = key.slice(7)
          write(' ' + k + '="')
          write({q: node.attributes[key]})
          write('"')
        } else if (key.slice(0,2) !== 't:'){
          write(' ' + key + '="' + escapeAttribute(node.attributes[key]) + '"')

        }
      })
      if (isSelfClosing(node)){
        write('/')
      }
      write('>')
    }


    if (isBound(node)){
      stepIn(true)
      if (node.attributes['t:view']){
        current.v = node.attributes['t:view']
      } 
      if (node.attributes['t:bind']){
        current.q = node.attributes['t:bind']
      } 
      if ('t:content' in node.attributes){
        current.vc = true
      }
    }
  }

  parser.ontext = function(text){
    write(escapeHTML(text))
  }

  parser.onclosetag = function(tag){
    if (depthStack[depthStack.length-1] == depth + 'in'){

      if (!current.c.length){
        delete current.c
      }

      if (current.by) { 
        delete current.by 
      }

      stepOut()
    }

    if (!isSelfClosing(tag) && !isPlaceholder(tag)){
      write('</' + tag + '>')
    }

    if (depthStack[depthStack.length-1] == depth){
      stepOut()
    }

    if (byDepthStack[byDepthStack.length-1] == depth){
      popBy()
    }

    depth-=1
  }

  parser.onscript = function(text){
    write(text)
  }

  parser.onprocessinginstruction = function(node){
    var require = /require (.+) as (.+)/.exec(node.body)
    if (require){
      result.requires = result.requires || {}
      result.requires[require[2].trim()] = require[1].slice(1,-1)
    }
  }

  parser.write(rawView)
  return result
}



var blockAttributes = [ 't:repeat', 't:when', 't:if', 't:unless', 't:context', 't:as' ]
function isBlock(node){
  return blockAttributes.some(function(attr){
    return attr in node.attributes
  })
}

var boundAttributes = [ 't:bind', 't:view', 't:content' ]
function isBound(node){
  return boundAttributes.some(function(attr){
    return attr in node.attributes
  })
}

function isPlaceholder(nodeOrTag){
  return (nodeOrTag.name || nodeOrTag) == 't:placeholder'
}


function isSelfClosing(nodeOrTag){
  var tag = (nodeOrTag.name || nodeOrTag)
  return !!~selfClosingTags.indexOf(tag)
}

function escapeHTML(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttribute(s) {
  return escapeHTML(s).replace(/"/g, '&quot;')
}