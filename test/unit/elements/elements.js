var assert = require('assert'),
	_ = require('lodash');

describe('Semantic Interface', function() {

	describe('.find()', function() {

		/////////////////////////////////////////////////////
		// TEST METHODS
		////////////////////////////////////////////////////

		it('should create a node using 2 custom types.', function(done) {
			Semantic.Node.create({
				'schema': {
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
		//		'schema': {
		//			'label': 'Fantastic Movie',
		//			'description': "This is an awesome parody!"
		//		},
		//		'schema_movie_single': {
		//			genre: 'Comedy',
		//			popularity: 8
		//		}
		//	}, {
		//		'type': ['schema_movie_single', 'schema'],
		//	}, function(err, users) {
		//		done();
		//	});
		//});


		it('should find a node and return both types.', function(done) {
			Semantic.Node.find({
				select: {
					'schema': {
						'label': true,
						'description': true
					},
					'schema_movie': {
						genre: true,
						popularity: true
					}
				},
				where: {
					'type': 'schema_movie'
				}
			}, {
				'custom_type': 'schema_movie'
			}, function(err, node) {

				done();
			});
		});

	});
});
