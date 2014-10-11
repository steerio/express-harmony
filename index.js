var ex = module.exports = require('express'),
    gen = (function () {
      try {
        var out;
        return eval('out = function* () {}').constructor
      } catch(e) {
        return null;
      }
    })();

if (!gen) {
  console.warn("---------------------------------------------------------------------");
  console.warn("Harmony generators are not supported, reverting to plain old Express.");
  console.warn("Your app will probably fail, try starting it with the --harmony flag!");
  console.warn("---------------------------------------------------------------------");
  return;
}

var map = Array.prototype.map;

function normalHandler(generator) {
  return function (req, res, next) {
    var instance = generator(req, res, next);
    function advance(arg) {
      var out = instance.next(arg);
      if (!out.done) out.value.then(advance).fail(next);
    }
    advance();
  }
}

function errorHandler(generator) {
  return function (err, req, res, next) {
    var instance = generator(err, req, res, next);
    function advance(arg) {
      var out = instance.next(arg);
      if (!out.done) out.value.then(advance).fail(next);
    }
    advance();
  }
}

function convert(obj) {
  if (obj.constructor == gen) {
    return obj.length == 4 ? errorHandler(obj) : normalHandler(obj);
  } else return obj;
}

function patchUse(obj) {
  var use = obj.use;

  obj.use = function () {
    return use.apply(this, map.call(arguments, convert));
  }
}

// App prototype

patchUse(require('express/lib/application'));

// Router

patchUse(ex.Router);

(function (router) {
  var param = router.param;

  router.param = function (name, cbk) {
    return param.call(this, name, convert(cbk));
  }
})(ex.Router);

(function (proto) {
  require('express/node_modules/methods').concat('all').forEach(function (m) {
    var orig = proto[m];
    proto[m] = function () {
      return orig.apply(this, map.call(arguments, convert));
    };
  });
})(require('express/lib/router/route').prototype);
