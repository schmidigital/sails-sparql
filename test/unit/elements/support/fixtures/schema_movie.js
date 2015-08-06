/**
 * Dependencies
 */

var Waterline = require('waterline');

module.exports = Waterline.Collection.extend({

  identity: 'schema_movie',
  connection: 'semantic',
  parent: ['object'],

  attributes: {
    genre: 'string',
    popularity: 'integer'
  }

});
