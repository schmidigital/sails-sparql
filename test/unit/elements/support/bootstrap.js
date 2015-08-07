/**
 * Module Dependencies
 */

var Waterline = require('waterline');
var _ = require('lodash');
var async = require('async');
var assert = require('assert');

// Require Fixtures
var fixtures = {
  UserFixture: require('./fixtures/element.js'),
  NodeFixture: require('./fixtures/node'),
  ObjectFixture: require('./fixtures/object'),
  SchemaFixture: require('./fixtures/schema_movie'),
};


/////////////////////////////////////////////////////
// TEST SETUP
////////////////////////////////////////////////////

var waterline, ontology;

before(function(done) {

  waterline = new Waterline();

  Object.keys(fixtures).forEach(function(key) {
    waterline.loadCollection(fixtures[key]);
  });

  var connections = { semantic: _.clone(Connections.test) };

  var defaults = { migrate: 'alter' };

  waterline.initialize({ adapters: { wl_tests: Adapter }, connections: connections, defaults: defaults }, function(err, _ontology) {
    if(err) return done(err);

    ontology = _ontology;

    Object.keys(_ontology.collections).forEach(function(key) {
      var globalName = key.charAt(0).toUpperCase() + key.slice(1);
      global.Semantic[globalName] = _ontology.collections[key];
    });

    done();
  });
});

after(function(done) {

  function dropCollection(item, next) {
    if(!Adapter.hasOwnProperty('drop')) return next();

    ontology.collections[item].drop(function(err) {
      if(err) return next(err);
      next();
    });
  }

  async.each(Object.keys(ontology.collections), dropCollection, function(err) {
    if(err) return done(err);
    waterline.teardown(done);
  });

});