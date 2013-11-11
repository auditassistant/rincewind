var View = require('../')
var test = require('tape')
var path = require('path')

test('require resolve', function(t){
  var render = View(__dirname + '/views/index.html')

  t.deepEqual(render.getExternal().map(function(f){
    return path.relative(__dirname, f)
  }), ['views/strong.js'])

  t.equal(render().trim(), '<h1> <span><strong>I am strong text</strong></span> </h1>')
  t.end()
})