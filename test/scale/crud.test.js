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

    // it('should destroy all the records', function(done) {
    //   Semantic.User.destroy(function(err, users) {
    //     assert(!err);
    //     done();
    //   });
    // });

    // it('should destroy all the records', function(done) {
    //   Semantic.Post.destroy(function(err, users) {
    //     assert(!err);
    //     done();
    //   });
    // });

    it('should create users', function(done) {

      // generate x users
      async.times(CONNECTIONS, function(n, next){
        var data = {
          first_name: "test_" + n,
          last_name: Math.floor((Math.random()*100000)+1),
          email: Math.floor((Math.random()*100000)+1)
        };

        Semantic.User.create(data, (err, user) => {
          if (!err) {
            var data_post = {
              title: "post_" + n,
              author: user.id
            }

            Semantic.Post.create(data_post, next);
          }
          else {
            done(err);
          }
        });
      }, function(err, users) {


        assert(!err);
        assert.strictEqual(users.length, CONNECTIONS);
        done();
      });
    });

 
    it('should find users with posts', function(done) {

      // generate x users
      async.times(CONNECTIONS, function(n, next){
        Semantic.User
        .find({ "first_name": "test_" + n })
        .populate("posts")
        .exec(next)
      }, function(err, users) {
        assert(!err);
        assert.strictEqual(users.length, CONNECTIONS);
        done();
      });
    }); 

  });

});
