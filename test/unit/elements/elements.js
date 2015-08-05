var assert = require('assert'),
	_ = require('lodash');

describe('Semantic Interface', function() {

	describe('.find()', function() {

		/////////////////////////////////////////////////////
		// TEST SETUP
		////////////////////////////////////////////////////

		before(function(done) {

			// Insert 10 Users
			var users = [];

			for(var i=0; i<10; i++) {
				users.push({first_name: 'find_user' + i, type: 'find test', age: i*10 });  // include an integer field
			}

			Semantic.User.createEach(users, function(err, users) {
				if(err) return done(err);
				done();
			});
		});

		/////////////////////////////////////////////////////
		// TEST METHODS
		////////////////////////////////////////////////////

		it('should create a text object with inherited values from object', function(done) {
			Semantic.Object.create({ type: 'schema_text',  }, function(err, users) {
				assert(!err);
				assert(Array.isArray(users));
				assert.strictEqual(users.length, 10);
				done();
			});
		});


	});
});
