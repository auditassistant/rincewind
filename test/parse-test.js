var test = require('tape')
var util = require('util')
var parseView = require('../lib/parse')

test("Parse standard elements", function(t){
  var view = "<div id='main'>Contents <strong>Some sub content</strong></div>"
  var expected = {
    c: ['<div id="main">Contents <strong>Some sub content</strong></div>']
  }
  t.deepEqual(parseView(view), expected)
  t.end()
})

test("Parse with no whitespace", function(t){
  var view = "<div id='main'>Contents <div t:whitespace='none'>Some sub content\n  <div> Test </div>\n</div></div>"
  var expected = {
    c: ["<div id=\"main\">Contents ",{c:["<div>Some sub content<div>Test</div></div>"]},"</div>"]
  }
  t.deepEqual(parseView(view), expected)
  t.end()
})


test("Parse standard elements with repeater", function(t){
  var view = "<div>Contents <span t:repeat='query'><span t:bind='.test:cat'/></span></div>"
  var expected = { 
    c: ['<div>Contents ', {
      r: 'query',
      c: ['<span><span>', {q: '.test:cat'}, '</span></span>']
    }, '</div>']
  }

  t.deepEqual(parseView(view), expected)
  t.end()
})

test("Parse standard elements with inner view", function(t){
  var view = "<div>Contents <strong>Some sub content</strong> <t:placeholder t:view='inline_item'/></div>"
  //console.log(util.inspect(parseView(view), false, 10))
  
  var expected = {
    c: ['<div>Contents <strong>Some sub content</strong> ', {v: 'inline_item'}, '</div>']
  }

  t.deepEqual(parseView(view), expected)
  t.end()
})

test("Parse standard elements with repeating inner view", function(t){
  var view = "<div>Contents <strong>Some sub content</strong> <div t:repeat='collection' t:view='inline_item'/></div>"
  //console.log(util.inspect(parseView(view), false, 10))
  
  var expected = {
    c: ['<div>Contents <strong>Some sub content</strong> ', {"c":["<div>",{"v":"inline_item"},"</div>"],"r":"collection"}, '</div>']
  }

  t.deepEqual(parseView(view), expected)
  t.end()
})

test("t:by and t:when", function(t){
  var view = "<div t:by='type'><div t:when='cat'>Cat</div><div t:when='dog'>Dog</div><div t:when='cat|dog'>Either</div></div>"
  //console.log(util.inspect(parseView(view), false, 10))
  
  var expected = {
    c: ['<div>', {c: ['<div>Cat</div>'], f: {type: 'cat'}}, {c: ['<div>Dog</div>'], f: {type: 'dog'}}, {c: ['<div>Either</div>'], f: {type: {$only: ['cat', 'dog']}}}, '</div>']
  }

  t.deepEqual(parseView(view), expected)
  t.end()
})

test("process requires", function(t){
  var view = "<? require './test.html' as test ?><? require './heading.html' as heading ?><div t:view='test'/>"
  //console.log(util.inspect(parseView(view), false, 10))
  
  var expected = {
    c: ['<div>', {v: 'test'}, '</div>'],
    requires: {
      'test': './test.html',
      'heading': './heading.html'
    }
  }

  t.deepEqual(parseView(view), expected)
  t.end()
})

test("process resources", function(t){
  var view = "<? resource './object.css' as Object ?><div t:bind:class=':css(Object)' />"
  //console.log(util.inspect(parseView(view), false, 10))
  
  var expected = {
    c: ['<div class="', {q: ':css(Object)', e: 'attr'}, '"></div>'],
    resources: {
      'Object': './object.css'
    }
  }

  t.deepEqual(parseView(view), expected)
  t.end()
})

test("self closing tags", function(t){
  var view = "<div><img src='test.jpg' /> <br /> <hr /><script src='test' />"
  
  var expected = {
    c: ['<div><img src="test.jpg"/> <br/> <hr/><script src="test"></script>']
  }

  t.deepEqual(parseView(view), expected)
  t.end()
})

test("bind with content already present (discard)", function(t){
  var view = '<div t:bind="test">Content</div>'
  
  var expected = {
    c: ['<div>', {q: 'test'}, '</div>']
  }

  t.deepEqual(parseView(view), expected)
  t.end()
})

test("bind with content already present and is view (discard)", function(t){
  var view = '<div t:bind="test" t:view="view">Content</div>'
  
  var expected = {
    c: ['<div>', {q: 'test', v: 'view', c: ['Content']}, '</div>']
  }

  t.deepEqual(parseView(view), expected)
  t.end()
})

test("bind attributes", function(t){
  var view = '<div t:bind:id="id">Content</div>'
  
  var expected = {
    c: ['<div id="', {q: 'id', e: 'attr'} ,'">Content</div>']
  }

  t.deepEqual(parseView(view), expected)
  t.end()
})

test("parse t:as", function(t){
  var view = '<div>stuff</div><div t:as="current">Content</div>'
  
  var expected = {
    c: ["<div>stuff</div>",{"c":["<div>Content</div>"],"as":"current"}]
  }

  t.deepEqual(parseView(view), expected)
  t.end()
})