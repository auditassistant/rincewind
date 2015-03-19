var View = require('../')
var test = require('tape')
var path = require('path')

test('require resolve', function(t){
  var render = View(__dirname + '/views/index.html')

  t.deepEqual(render.getExternal().map(function(f){
    return path.relative(__dirname, f)
  }), ['views/strong.js', 'node_modules/module-with-views/em.js'])

  t.equal(render().trim(), '<section> <h1> <span><strong>I am strong text</strong></span> <span><em>I am italic text</em></span> </h1> </section>')
  t.end()
})

test('package require resolve', function(t){
  var render = View('another-module/index.html')

  t.deepEqual(render.getExternal().map(function(f){
    return path.relative(__dirname, f)
  }), ['node_modules/module-with-views/em.js'])

  t.equal(render().trim(), '<section> <span><em>I am italic text</em></span> </section>')
  t.end()
})

test('resource resolve', function(t){
  var render = View(__dirname + '/views/resources.html')

  function get(query){
    if (query === ':css(Object)'){
      return this.locals['Object'].key
    }
  }

  t.equal(render({get: get}).trim(), '<div class="RSOTT2TBEG-object">Content</div>')
  t.end()
})