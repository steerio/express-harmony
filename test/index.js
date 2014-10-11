var express = require('..'),
    router = express.Router,
    request = require('supertest'),
    lstat = require('q').denodeify(require('fs').lstat),
    re = /"atime":/;

// Middleware and callbacks to test with.
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

var params = {
  "generator": function* (req, res, next, fname) {
    try {
      req.foo = yield lstat(fname);
    } catch(e) {}
    next();
  },
  "function": function (req, res, next, fname) {
    lstat(fname).then(function (ls) {
      req.foo = ls;
      next();
    }).fail(function () {
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

var errors = {
  "generator": function* (err, req, res, next) {
    var stat = yield lstat('package.json');
    res.status(500).json({ code: err.code });
  },
  "function": function (err, req, res, next) {
    res.status(500).json({ code: err.code });
  }
}

// Helper functions

function iterate(obj, fn) {
  Object.getOwnPropertyNames(obj).forEach(function (n) {
    fn(n, obj[n]);
  });
}

function valueFromRequest(req, res) {
  if (req.foo)
    res.json(req.foo); else
    res.status(404);
}

describe('App', function () {
  var routes = router().get('/bar', valueFromRequest);

  iterate(middleware, function (kind, mware) {
    it('should accept a '+kind+' as middleware', function (done) {
      var app = express().use(mware).use('/foo', routes);

      request(app).
        get('/foo/bar').
        expect(re).
        end(done);
    });
  });

  iterate(errors, function (kind, handler) {
    it('should capture errors and send to '+kind+' handlers', function (done) {
      var routes = router(),
          app = express().use(routes).use(handler)

      routes.get('/foo', function* (req, res) {
        var ls = yield lstat("NONEXISTENT");
        res.json(ls);
      });

      request(app).
        get('/foo').
        expect(/ENOENT/).
        end(done);
    });
  });
});

describe('Router', function () {
  iterate(middleware, function (kind, mware) {
    it('should accept a '+kind+' as middleware', function (done) {
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

  iterate(params, function (kind, handler) {
    it('should accept a '+kind+' as param handler', function (done) {
      var routes = router(),
          app = express().use('/foo', routes);

      routes.param('fname', handler);
      routes.get('/:fname', valueFromRequest);

      request(app).
        get('/foo/package.json').
        expect(re).
        end(done);

      request(app).
        get('/foo/NONEXISTENT').
        expect(404).
        end(done);
    });
  });

  iterate(callbacks, function (kind, cbk) {
    it('should accept a '+kind+' as callback', function (done) {
      var routes = router().get('/bar', cbk),
          app = express().use('/foo', routes);

      request(app).
        get('/foo/bar').
        expect(re).
        end(done);
    });
  });
});
