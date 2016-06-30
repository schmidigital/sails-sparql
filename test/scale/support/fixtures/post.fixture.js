/**
 * Dependencies
 */

var Waterline = require('waterline');

module.exports = Waterline.Collection.extend({

  identity: 'post',
  tableName: 'postTable',
  connection: 'semantic',

  attributes: {
    title: 'string',
    author: {
      collection: 'User',
      via: 'posts'
    }
  }

});
