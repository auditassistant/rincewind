var View = require('../')
var test = require('tape')

test('stringify direct parse', function(t){
  var raw = "<? require './test.html' as test ?><? require './textile.js' as textile ?><? resource './object.css' as Object ?><div t:view='test'/>"
  
  var expected = '{"c": ["<div>",{"v":"test"},"</div>"], "resources": {"Object": "./object.css"}, "views": {"test": {"c": ["<div>Test</div>"]},"textile": require("./textile")}}'
  var view = View({parse: raw})

  view.addView('test', View({parse: '<div>Test</div>'}))
  view.addView('textile', {require: 'textile'})

  t.deepEqual(view.stringify(), expected)
  t.end()
})

test('stringify required', function(t){

  var view = View(__dirname + '/views/resources.html')
  var expected = '{"c": [" <div class=\\"",{"q":":css(Object)","e":"attr"},"\\">Content</div>"], "resources": {"Object": {"key":"RSOTT2TBEG-object","path":"./test/views/object.css"}}, "views": {}}'

  t.deepEqual(view.stringify(), expected)
  t.end()
})