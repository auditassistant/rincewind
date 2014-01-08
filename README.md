rincewind
===

An HTML based template engine with a few ever-so-slightly magic attributes.

[![NPM](https://nodei.co/npm/rincewind.png?compact=true)](https://nodei.co/npm/rincewind/)

## Example

Here's some data we want to display to the user. It's a basic blog:

```js
var data = {

  post: {
    title: "Rincewind! The not really but sort of magic templating engine.",
    date: "1 April 2013",
    body: "A lot of text with clever puns etc."
  },

  comments: [
    { name: 'Joe Blogs',
      date: '2 April 2013',
      body: "Get it? My name is Joe and a blog ;)"
    },
    { name: 'Anonymous Coward',
      date: '2 April 2013',
      body: "I am a coward."
    }
  ]

}
```

And here's a view to make it browsery:

```html
<!-- post.html -->
<? require './markdown.js' as markdown ?>
<? require './widget.html' as widget ?>

<article class='Post'>
  <header>
    <h1 t:bind='post.title' />
    <p t:bind='post.date' />
  </header>
  <div t:bind='post.body' t:view='markdown' />

  <section class='comments'>
    <header>Comments</header>
    
    <div t:repeat='comments'>
      <header>
        <strong t:bind='.name' /> on
        <span t:bind='.date' />
      </header>
      <div t:bind='.body' t:view='markdown' />
    </div>

  </section>

  <aside t:view='widget' />
</article>
```

```html
<!-- widget.html -->
<h1>Cool Links!</h1>
<ul>
  <li><a href='https://github.com'>Github</a></li>
  <li><a href='http://nodejs.org'>Node.js</a></li>
  <li><a href='https://npmjs.org'>npm</a></li>
</ul>
```

```js
// markdown.js
var marked = require('marked')
module.exports = function(context){
  return marked(context.source)
}
```

And a master/layout to hold it:

```html
<!-- master.html -->
<html>
  <head>
    <title>Matt's Blog</title>
    <link rel='stylesheet' href='/styles.css' />
  </head>
  <body>

    <header>
      <h1><a href='/'>Matt's Blog</a></h1>
      <p>Not just another wordpress</p>
    </header>

    <div>
      <t:placeholder t:content />
    </div>

    <footer>Powered by Node, NPM and You</footer>
  </body>

</html>
```

### Now let's hook it all up!

Create our views and do some databinding with json-query.

```js
var fs = require('fs')
var View = require('rincewind')
var jsonQuery = require('json-query')

var master = View(__dirname + '/master.html')
var renderView = View(__dirname + '/post.html')

function respond(req, res, data){
  var queryHandler = function(query){
    return jsonQuery(query, {
      rootContext: data,
      context: this.source,
      override: this.override
    }).value
  }

  var html = master({
    get: queryHandler
    content: renderView({get: queryHandler})
  })

  res.end(html)
}

var server = http.createServer(function(req,res){
  respond(req, res, data)
})
```

### Inline views

```js
var View = require('rincewind')
var renderView = View({parse: '<div><div t:bind="value" /></div>'})
```

## Preloading views

### Manually

```js
var View = require('rincewind')
var precompiled = View(__dirname + '/view.html').getCompiledView()
```

Then send the precompiled value to the browser.

```js
// recreate in the browser
var View = require('rincewind')
var renderView = View(precompiled)
```

### Browserify transform

Or you can use [rincewind-precompile-transform](https://github.com/mmckegg/rincewind-precompile-transform) which will automatically compile and inline any rincewind views in your source for the browser bundle.

```bash
$ browserify entry.js -t rincewind-precompile-transform > output.js
```

### Watch script

For more control use [rincewind-watch](https://github.com/mmckegg/rincewind-watch) to and trigger callbacks on changes and manually compile to javascript (and call `view.stringify(relativePath)`). The compiled file can then be required by your code.


## The magic t:attributes


### Attribute: `t:bind` 

Any time the system hits a `t:bind` attribute while rendering the view, it calls the `queryHandler` function with the value and additional context info (`parent`, `source` etc). 

### Attribute: `t:bind:<attribute-name>` 

We can bind arbitrary attributes using the same method by using `t:bind:<attribute-name>`. 

For example, if we wanted to bind an element's ID to the query `element_id`:

```html
<span t:bind:id='element_id'>content unchanged</span>
```

Which would output:

```html
<span id='value'>content unchanged</span>
```

### Attribute: `t:if`

The element will only be rendered if the specified query **returns a truthy value**.

```html
<span t:if='show_content'>Only shows if show_content returns true</span>
```

### Attribute: `t:unless`

The inverse of `t:if`. The element will only be rendered if the specified query **returns a falsy value**.

### Attribute: `t:by` and `t:when`

An extension of the if system. Much like a `switch` or `case` statement. Specify the source query using `t:by` then any sub-elements can use `t:when` to choose what value the `t:by` query must return in order for them to show. Multiple values may be specified by separating with the pipe symbol (e.g. `value1|value2|value3`).

```html
<div t:by='type'>
  <div t:when='example'>
    This div is only rendered if the query "type" returns the value "example".
  </div>
  <div t:when='production'>
    This div is only rendered if the query "type" returns the value "production".
  </div>
  <div t:when='trick|treat'>
    This div is rendered when the query "type" returns the value "trick" or "treat".
  </div>
</div>
```

### Attribute: `t:repeat`

For binding to arrays and creating repeating content. The attribute value is queried and the element is duplicated for every item in the returned array.

For this [JSON Context](http://github.com/mmckegg/json-context) datasource:

```js
var datasource = JsonContext({
  posts: [
    {id: 1, title: "Post 1", body: "Here is the body content"},
    {id: 2, title: "Post 2", body: "Here is some more body content"},
    {id: 3, title: "Post 3", body: "We're done."},
  ]
})
```

And this template:

```html
<div class='post' t:repeat='posts' t:bind:data-id='.id'>
  <h1 t:bind='.title'>Will replaced with the value of title</h1>
  <div t:bind='.body'>Will replaced with the value of body</div>
</div>
```

We would get:

```html
<div class='post' data-id='1'>
  <h1>Post 1</h1>
  <div>Here is the body content</div>
</div>
<div class='post' data-id='2'>
  <h1>Post 2</h1>
  <div>Here is some more body content</div>
</div>
<div class='post' data-id='3'>
  <h1>Post 3</h1>
  <div>We're done.</div>
</div>
```

If required (e.g. nesting repeaters) you can use `t:as` to assign the context a name and reference it by that instead of '.' - this will only work if `templateContext.override` is handled by the query engine.

```html
<div class='post' t:repeat='posts' t:as='post' t:bind:data-id='.id'>
  <div t:repeat='something_else'>
    Can still access the post!
    <span t:bind='post.name' />
  </div>
</div>
```
### Attribute: `t:view`

Specify a sub-view to render as the content of the element.

```html
<!-- view.html -->
<? require './subview.html' as subview ?>
<div>
  <div t:view='subview' />
</div>
```

```html
<!--- subview.html -->
<div>Sub-view content</div>
```

Format content in specific way:

```html
<? require './format.html' as format ?>
<div>
  <div t:bind='contact' t:view='format' />
</div>
```

```html
<!--- format.html -->
<strong><span t:bind='.name' />:</strong> <span t:bind='.address' />
```

Or require javascript view:

```html
<? require './markdown.html' as markdown ?>
<div>
  <div t:bind='body' t:view='markdown' />
</div>
```

```js
// markdown.js
var marked = require('marked')
module.exports = function(context){
  return marked(context.source)
}
```

Wrap content using javascript:

```html
<? require './wrapper.html' as wrap ?>
<div>
  <t:placeholder t:view='wrap' />
</div>
```

```js
// wrapper.html
var marked = require('marked')
module.exports = function(context){
  return '<strong>' + context.content + '</strong>'
}
```

If the element had content specified, it will be overrided with the content of the subview, but if the subview contains an element with the attribute `t:content`, the removed content will be inserted here. This allows creating views that act like wrappers.

### Attribute: `t:content`

This attribute accepts no value and is used to denote where to insert inner content.

Say we have this master layout:

```html
<!--/views/layout.master.html-->
<html>
  <head>
    <title>My Blog</title>
  </head>
  <body>
    <h1>My Blog</h1>
    <div t:content id='content'></div>
  </body>
</html>
```

And this view:

```html
<!--/views/content.html-->
<h2>Page title</h2>
<div>I am the page content</div>
```

We would get:

```html
<html>
  <head>
    <title>My Blog</title>
  </head>
  <body>
    <h1>My Blog</h1>
    <div id='content'> <!--inner view is inserted here--> 
      <h2>Page title</h2>
      <div>I am the page content</div>
    </div>
  </body>
</html>
```
