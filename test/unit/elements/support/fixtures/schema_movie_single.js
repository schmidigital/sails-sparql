/**
 * Dependencies
 */

var Waterline = require('waterline');

module.exports = Waterline.Collection.extend({

  identity: 'schema_movie_single',
  connection: 'semantic',

  attributes: {
    genre: 'string',
    popularity: 'integer'
  }

});
