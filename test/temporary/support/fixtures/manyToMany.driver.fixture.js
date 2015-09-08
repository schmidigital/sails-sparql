/**
 * Dependencies
 */

var Waterline = require('waterline');

module.exports = Waterline.Collection.extend({

  tableName: 'driverTable',
  identity: 'driver',
  connection: 'associations',
	autoPK: false,
  // migrate: 'drop',
  attributes: {
		id: {
			type: 'string',
			primaryKey: true
		},
    name: 'string',
    taxis: {
      collection: 'taxi',
      via: 'drivers',
      dominant: true
    },

    toJSON: function() {
      var obj = this.toObject();
      delete obj.name;
      return obj;
    }
  }
});
