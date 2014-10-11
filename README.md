# Express for Harmony

## How it works

Require this package instead of `express` to be able to use Harmony generators
as middleware and callbacks. They will automatically be wrapped with code that
handles promises in the background, allowing your handlers to look like this:

```javascript
router.get('/:id', function* (req, res) {
  var obj = yield req.db.findOne({ _id: req.params.id });

  if (obj) {
    res.json(obj)
  } else {
    res.status(404).json({ err: "Not found" });
  }
});
```

The same goes for error handlers and middleware.

## Errors

Errors coming from generator handlers or middleware will be funneled properly
to error handlers. This is true to ones raised by sync code and ones coming
from promises as well.

You can install a generic error handler to catch all exceptions that were not
caught in your route handlers.

The following (admittedly pointless) example demonstrates the idea:

```javascript
var read = Q.denodeify(fs.readFile);

// Omitting some boilerplate with router and app.

router.get('/read/:fname', function* (req, res) {
  var file = yield read(req.params.fname);
  res.json({ content: file });
});

app.use(function* (err, req, res, next) {
  res.status(500).json({ code: err.code });
})
```

Calling the above route with a non-existent filename will cause a status of 500
to be returned along with the content `{"code":"ENOENT"}`.
