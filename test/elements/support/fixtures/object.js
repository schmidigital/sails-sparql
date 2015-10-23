/**
 * Dependencies
 */

var Waterline = require('waterline');

module.exports = Waterline.Collection.extend({

  identity: 'object',
  connection: 'semantic',

  attributes: {
    created_at: 'date',
    author: 'string'
  }

});
