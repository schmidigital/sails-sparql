/**
 * Dependencies
 */

var Waterline = require('waterline');

module.exports = Waterline.Collection.extend({

  identity: 'schemamovie',
  connection: 'semantic',
  parent: ['object'],

  attributes: {
    genre: 'string',
    popularity: 'integer'
  }

});
