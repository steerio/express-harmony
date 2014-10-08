var express = require('..'),
    router = express.Router,
    request = require('supertest'),
    lstat = require('q').denodeify(require('fs').lstat),
    re = /"atime":/;

// Define middleware and callbacks to test with.
// The generator and function versions shall do the same.

var middleware = {
  "generator": function* (req, res, next) {
    req.foo = yield lstat('package.json');
    next();
  },
  "function": function (req, res, next) {
    lstat('package.json').then(function (ls) {
      req.foo = ls;
      next();
    });
  }
}

var callbacks = {
  "generator": function* (req, res) {
    var stat = yield lstat('package.json');
    res.json(stat);
  },
  "function": function (req, res) {
    lstat('package.json').then(function (ls) {
      res.json(ls);
    });
  }
}

// Function to iterate the above

function iterate(obj, fn) {
  Object.getOwnPropertyNames(obj).forEach(function (n) {
    fn(n+"s", obj[n]);
  });
}

// Callback to render value saved by the middleware

function valueFromRequest(req, res) { res.json(req.foo); }

// Actual tests

describe('App', function () {
  var routes = router().get('/bar', valueFromRequest);

  iterate(middleware, function (kind, mware) {
    it('should accept '+kind+' as middleware', function (done) {
      var app = express().use(mware).use('/foo', routes);

      request(app).
        get('/foo/bar').
        expect(re).
        end(done);
    });
  });
});

describe('Router', function () {
  iterate(middleware, function (kind, mware) {
    it('should accept '+kind+' as middleware', function (done) {
      var routes = router(),
          app = express().use('/foo', routes);

      routes.use(mware);
      routes.get('/bar', valueFromRequest);

      request(app).
        get('/foo/bar').
        expect(re).
        end(done);
    });
  });

  iterate(callbacks, function (kind, cbk) {
    it('should accept '+kind+' as callback', function (done) {
      var routes = router().get('/bar', cbk),
          app = express().use('/foo', routes);

      request(app).
        get('/foo/bar').
        expect(re).
        end(done);
    });
  });
});
