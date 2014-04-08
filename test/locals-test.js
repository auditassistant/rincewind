var test = require('tape')

var View = require('../')
var render = View(__dirname + '/views/locals.html')

test(function(t){

  function get(query){
    var text = 'Hello world'
    var arg = 'arg value'
    if (query === 'text:format(arg)'){
      console.log(this.locals)
      return this.locals.format.call(this, text, arg)
    }
  }

  var result = render({get: get})
  t.equal(result, ' <span>Hello world!!! - arg value</span>')
  t.end()
})