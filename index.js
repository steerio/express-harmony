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

var router = ex.Router,
    Q = require('q'),
    proto = require('express/lib/application'),
    map = Array.prototype.map,
    slice = Array.prototype.slice;

function convert(obj) {
  return obj.constructor == gen ? Q.async(obj) : obj;
}

(function () {
  var use = proto.use;
  proto.use = function () {
    return use.apply(this, map.call(arguments, convert));
  }
})();

(function () {
  var use = router.use;
  router.use = function () {
    return use.apply(this, map.call(arguments, convert));
  }
})();

require('express/node_modules/methods').concat('all').forEach(function (m) {
  router[m] = function (path) {
    var route = this.route(path);
    route[m].apply(route, slice.call(arguments, 1).map(convert));
    return this;
  };
});
