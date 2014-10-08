# Express for Harmony

Require this package instead of `express` to be able to use Harmony generators
as middleware and callbacks. They will automatically be wrapped using
`Q.async`, allowing code like this:

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
