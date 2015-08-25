/**
 * Dependencies
 */

var Waterline = require('waterline');

module.exports = Waterline.Collection.extend({

  identity: 'element',
  connection: 'semantic',

  attributes: {
		order: 'integer',
  	schema: {
			model: 'schema'
		}
  }

});
