var assert = require('assert'),
	_ = require('lodash');

describe('Semantic Interface', function() {

	describe('.find()', function() {

		/////////////////////////////////////////////////////
		// TEST METHODS
		////////////////////////////////////////////////////

		it('should create a node using 2 custom types.', function(done) {
			Semantic.Node.create({
				'object': {
					'label': 'Fantastic Movie',
					'description': "This is an awesome parody!"
				},
				'schema_movie': {
					genre: 'Comedy',
					popularity: 8
				}
			}, {
				'custom_type': 'schema_movie'
			}, function(err, node) {

				done();
			});
		});


		//it('should create a node using 1 type and its class inheritance.', function(done) {
		//	Semantic.Node.create({
		//		'object': {
		//			'label': 'Fantastic Movie',
		//			'description': "This is an awesome parody!"
		//		},
		//		'schema_movie_single': {
		//			genre: 'Comedy',
		//			popularity: 8
		//		}
		//	}, {
		//		'type': ['schema_movie_single', 'object'],
		//	}, function(err, users) {
		//		done();
		//	});
		//});

	});
});
