/**
 * Dependencies
 */

var Waterline = require('waterline');

module.exports = Waterline.Collection.extend({

  identity: 'node',
  connection: 'semantic',

  virtual: 'true',

  attributes: {
  }

});
