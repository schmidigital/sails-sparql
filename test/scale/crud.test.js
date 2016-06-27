// TODO: test basic CRUD functionality (semantic interface) at high concurrency

// TODO: measure memory usage
// TODO: measure execution time
// TODO: track any failures/errors


var assert = require('assert'),
    async = require('async');

var CONNECTIONS = 100;

describe('Load Testing', function() {
  this.timeout(60000);


  // TODO: try out `benchmark` library

  /////////////////////////////////////////////////////
  // TEST METHODS
  ////////////////////////////////////////////////////


  describe('create with x connection', function() {

    it('should not error', function(done) {

      // generate x users
      async.times(CONNECTIONS, function(n, next){

        var data = {
          first_name: Math.floor((Math.random()*100000)+1),
          last_name: Math.floor((Math.random()*100000)+1),
          email: Math.floor((Math.random()*100000)+1)
        };

        Semantic.User.create(data, next);
      }, function(err, users) {
        assert(!err);
        assert.strictEqual(users.length, CONNECTIONS);
        done();
      });
    });
  });

});
