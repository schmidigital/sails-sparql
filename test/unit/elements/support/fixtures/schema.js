/**
 * Dependencies
 */

var Waterline = require('waterline');

module.exports = Waterline.Collection.extend({

  identity: 'schema',
  connection: 'semantic',

  attributes: {
		label: 'string',
		description: 'string',
		thumbnail: 'type:image'
  }

});
