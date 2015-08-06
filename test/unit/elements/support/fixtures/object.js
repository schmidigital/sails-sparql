/**
 * Dependencies
 */

var Waterline = require('waterline');

module.exports = Waterline.Collection.extend({

  identity: 'object',
  connection: 'semantic',

  attributes: {
	label: 'string',
	description: 'string',
  	object: {
		model: 'object'
	}
  }

});
