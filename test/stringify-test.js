var View = require('../')
var test = require('tape')

test('stringify direct parse', function(t){
  var raw = "<? require './test.html' as test ?><? require './textile.js' as textile ?><div t:view='test'/>"
  
  var expected = '{"c": ["<div>",{"v":"test"},"</div>"], "views": {"test": {"c": ["<div>Test</div>"]},"textile": require("./textile")}}'
  var view = View({parse: raw})

  view.addView('test', View({parse: '<div>Test</div>'}))
  view.addView('textile', {require: 'textile'})

  t.deepEqual(view.stringify(), expected)
  t.end()
})

test('stringify cirular', function(t){
  var expected = "{\"c\": [\" <div>circular lol</div>\"], \"views\": {\"self\": \"$self\"}}"
  var view = View('./views/circular.html')
  t.deepEqual(view.stringify(), expected)
  t.end()
})