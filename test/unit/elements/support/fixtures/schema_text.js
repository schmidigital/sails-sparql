/**
 * Dependencies
 */

var Waterline = require('waterline');

module.exports = Waterline.Collection.extend({

  identity: 'schema_text',
  connection: 'semantic',
  subclassof: ['object'],

  attributes: {
    schema: 'string',
  	object: {
		model: 'object'
	}
  }

});
