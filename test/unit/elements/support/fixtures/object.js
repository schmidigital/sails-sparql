/**
 * Dependencies
 */

var Waterline = require('waterline');

module.exports = Waterline.Collection.extend({

  identity: 'object',
  connection: 'semantic',

  attributes: {
    schema: 'string',
  	object: {
		model: 'object'
	}
  }

});
