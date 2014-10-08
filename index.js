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

var Q = require('q'),
    map = Array.prototype.map;

function convert(obj) {
  return obj.constructor == gen ? Q.async(obj) : obj;
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
