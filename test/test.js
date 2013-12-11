var getTemplate = require('../')
var test = require('tape')


test('Root template binding', function(t){
  t.plan(1)

  var get = createGetter({
    title: 'Page Title',
    type: 'page',
    data: 'stuff'
  })

  var render = getTemplate({parse: '<div t:bind:data-attr="data"> <h1 id="heading" t:bind="title" /> <div t:bind:class="type">Content</div> </div>'})
  var expected = '<div data-attr="stuff"> <h1 id="heading">Page Title</h1> <div class="page">Content</div> </div>'

  t.equal(render({get: get}), expected)
})


test('Repeater', function(t){
  t.plan(1)

  var get = createGetter({
    items: [
      {name: 'Item 1', type: 'Thing'},
      {name: 'Item 2', type: 'OtherThing'}
    ]
  })

  var render = getTemplate({parse: '<ul> <li t:repeat="items" t:bind=".name" t:bind:class=".type" /> </ul>'})
  var expected = '<ul> <li class="Thing">Item 1</li><li class="OtherThing">Item 2</li> </ul>'

  t.equal(render({get: get}), expected)
})

test('Repeater conditional', function(t){
  t.plan(1)

  var get = createGetter({
    items: [
      {name: 'Item 1', type: 'Thing'},
      {name: 'Item 2', type: 'OtherThing', show: true}
    ]
  })

  var render = getTemplate({parse: '<ul> <li t:repeat="items" t:if=".show" t:bind=".name" t:bind:class=".type" /> </ul>'})
  var expected = '<ul> <li class="OtherThing">Item 2</li> </ul>'

  t.equal(render({get: get}), expected)
})

test('Context as', function(t){
  t.plan(1)

  var get = createGetter({
    items: [
      {name: 'Item 1', type: 'Thing'},
      {name: 'Item 2', type: 'OtherThing'}
    ]
  })

  var render = getTemplate({parse: '<ul> <li t:repeat="items" t:as="item" t:bind:class=".type"><span t:bind="item.name"/></li> </ul>'})
  var expected = '<ul> <li class="Thing"><span>Item 1</span></li><li class="OtherThing"><span>Item 2</span></li> </ul>'

  t.equal(render({get: get}), expected)
})

test('Inner view', function(t){
  t.plan(1)

  var get = createGetter({
    items: [
      {name: 'Item 1', type: 'Thing'},
      {name: 'Item 2', type: 'OtherThing'}
    ]
  })

  var render = getTemplate({parse: '<div> <h1>Title</h1> <div t:view="inner" /> </div>'})
  render.addView('inner', {parse: '<ul> <li t:repeat="items" t:bind=".name" t:bind:class=".type" /> </ul>'})

  var expected = '<div> <h1>Title</h1> <div><ul> <li class="Thing">Item 1</li><li class="OtherThing">Item 2</li> </ul></div> </div>'

  t.equal(render({get: get}), expected)
})

test('Inner view with placeholder', function(t){
  t.plan(1)

  var get = createGetter({
    items: [
      {name: 'Item 1', type: 'Thing'},
      {name: 'Item 2', type: 'OtherThing'}
    ]
  })

  var render = getTemplate({parse: '<div> <h1>Title</h1> <t:placeholder t:view="inner" /> </div>'})
  render.addView('inner', {parse: '<ul> <li t:repeat="items" t:bind=".name" t:bind:class=".type" /> </ul>'})

  var expected = '<div> <h1>Title</h1> <ul> <li class="Thing">Item 1</li><li class="OtherThing">Item 2</li> </ul> </div>'

  t.equal(render({get: get}), expected)
})

test('Conditional elements', function(t){
  t.plan(1)

  var get = createGetter({
    showFirst: true,
    showSecond: false
  })

  var render = getTemplate({parse: '<div> <span t:if="showFirst">First</span> <span t:if="showSecond">Second</span> </div>'})

  var expected = '<div> <span>First</span>  </div>'

  t.equal(render({get: get}), expected)
})

test("bind with content already present (discard)", function(t){
  t.plan(1)

  var render = getTemplate({parse: '<div t:bind="test">Content</div>'})

  var get = createGetter({
    test: 'value'
  })

  var expected = '<div>value</div>'
  t.equal(render({get: get}), expected)
})

test("bind with content already present and is view (preserve)", function(t){

  t.plan(1)

  var render = getTemplate({parse: '<div t:bind="test" t:view="view">Content</div>'})
  render.addView('view', function(context){
    return '<strong>' + context.source + '</strong>' + context.content
  })

  var get = createGetter({
    test: 'value'
  })

  var expected = '<div><strong>value</strong>Content</div>'
  t.equal(render({get: get}), expected)
})

function createGetter(data){
  return function(query){
    var overrides = this.override || {}
    if (query.charAt(0) == '.'){
      return (this.source || data)[query.slice(1)]
    } else if (query.indexOf('.')){
      var parts = query.split('.')
      var result = overrides[parts[0]] || data[parts[0]] 
      parts.slice(1).forEach(function(p){
        result = result && result[p] != null && result[p] || null
      })
      return result
    } else {
      return overrides[query] || data[query] 
    }
  }
}
