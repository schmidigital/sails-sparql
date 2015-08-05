/**
 * Dependencies
 */

var Waterline = require('waterline');

module.exports = Waterline.Collection.extend({

  identity: 'element',
  connection: 'semantic',

  attributes: {
    schema: 'string',
  	object: {
		model: 'object'
	}
  }

});
