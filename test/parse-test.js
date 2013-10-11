var test = require('tape')
var util = require('util')
var parseView = require('../lib/parse')

test("Parse standard elements", function(t){
  var view = "<div>Contents <strong>Some sub content</strong></div>"
  var expected = { 
    'main': {
      ref: 'main',
      elements: [[ 
        'div',{},[ 'Contents ', [ 'strong', {}, [ 'Some sub content' ] ] ] 
      ]],
      sub: [],
      subViews: [],
      subBindings: [],
      bindings: [],
      _isView: true 
    },
    $referencedViews: [],
    $root: 'main'
  }
  t.deepEqual(parseView(view, 'main'), expected)
  t.end()
})


test("Parse standard elements", function(t){
  var view = "<div>Contents <span t:repeat='query'><span t:bind='.test:cat'/></span></div>"
  var expected = { 
    'main': {
      ref: 'main',
      elements: [ 
        ['div',{},[ 'Contents ', {template: 'main:1'} ] ]
      ],
      sub: ['main:1'],
      bindings: [],
      subBindings: ['query'],
      subViews: [],
      _isView: true 
    },
    'main:1': {
      ref: 'main:1',
      query: 'query',
      elements: [ 
        [ 'span', {}, [ 
          [ 'span', { _bind: '.test:cat' } ] 
        ] ]
      ],
      sub: [],
      subViews: [],
      subBindings: [],
      bindings: ['.test:cat']
    },
    $referencedViews: [],
    $root: 'main'
  }

  console.error(util.inspect(parseView(view, 'main'), false, 10))

  t.deepEqual(parseView(view, 'main'), expected)
  t.end()
})

// TODO: More tests

test("Parse standard elements with inner view", function(t){
  var view = "<div>Contents <strong>Some sub content</strong> <placeholder t:view='inline_item'/></div>"
  //console.log(util.inspect(parseView(view), false, 10))
  
  var expected = {
    'main': {
      ref: 'main',
      elements:
      [
        ['div',{},[
          'Contents ',['strong', {},['Some sub content']],' ',['placeholder',{
            _view: 'inline_item'
          },[]]]
        ]
      ],
      sub: [],
      subViews: ['inline_item'],
      bindings: [],
      subBindings: [],
      _isView: true
    },
    $referencedViews: ['inline_item'],
    $root: 'main'
  }
  t.deepEqual(parseView(view, 'main'), expected)
  t.end()
})