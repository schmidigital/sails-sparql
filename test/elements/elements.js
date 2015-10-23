var assert = require('assert'),
	_ = require('lodash');

describe('Semantic Interface', function() {

	describe('.find()', function() {

		/////////////////////////////////////////////////////
		// TEST METHODS
		////////////////////////////////////////////////////

		//it('should create a node using 2 custom types.', function(done) {
		//	Semantic.Node.create({
		//		'schema': {
		//			'label': 'Fantastic Movie',
		//			'description': "This is an awesome parody!"
		//		},
		//		'schema_movie': {
		//			genre: 'Comedy',
		//			popularity: 8
		//		}
		//	}, {
		//		'custom_type': 'schema_movie'
		//	}, function(err, node) {
    //
		//		done();
		//	});
		//});


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

		var movie_id;


		it('should create a movie with object.', function(done) {
			Semantic.Schemamovie.create({
					genre: 'comedy'
				}, {
					types: {
						object: {
							author: 'Michael'
						}
					}
				}, function(err, movie) {
					movie_id = movie.id;
					done();
				});
		});


		it('should add the movie to an element.', function(done) {
			Semantic.Element.create({
					order: '1',
					schema: 'schemamovie',
					object: movie_id
				}, function(err, result) {
					assert(result.object)
					done();
				});
		});


		it('should find the object and get its movie object.', function(done) {
			Semantic.Object.findOne({ id: movie_id }, function(err, result) {
					assert(result.object)
					done();
				});
		});



		//it('should find a node and return both types.', function(done) {
		//	Semantic.schema_movie.find({
		//		select: {
		//			'schema': {
		//				'label': true,
		//				'description': true
		//			},
		//			'schema_movie': {
		//				'genre': true,
		//				'popularity': true
		//			}
		//		},
		//		where: {
		//			'genre': 'comedy'
		//		}
		//	}, {
		//		'custom_type': 'schema_movie'
		//	}, function(err, node) {
    //
		//		done();
		//	});
		//});

	});
});
