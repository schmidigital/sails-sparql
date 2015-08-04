var moment = require('moment'),

escape = function (str) {
	return str
		.replace(/[\\]/g, '\\\\')
		.replace(/[\"]/g, '\\\"')
		.replace(/[\/]/g, '\\/')
		.replace(/[\b]/g, '\\b')
		.replace(/[\f]/g, '\\f')
		.replace(/[\n]/g, '\\n')
		.replace(/[\r]/g, '\\r')
		.replace(/[\t]/g, '\\t');
};

module.exports = {
	fromSparql: {
		boolean: function(value) {
			return value === 'true';
		},
		integer: function(value) {
			return value - 0;
		},
		string: function(value) {
			return value;
		},

		text: function(value) {
			return value;
		},

		'float': function(value) {
			return value - 0;
		},

		'date': function(value) {
			return moment(value,'YYYY-MM-DD');
		},

		datetime: function(value) {
			console.log(moment(value).format());


			return moment(value);
		},

		'binary': function(value) {


		},

		'array': function(value) {

		},

		'json': function(value) {

		}

	},
	toSparql: {
		boolean: function(value) {
			return '"' + value + '"^^xsd:boolean';
		},
		integer: function(value) {
			return '"' + value + '"^^xsd:integer';
		},
		string: function(value) {
			return '"' + escape(value) + '"';
		},

		text: function(value) {
			return '"' + escape(value) + '"';
		},

		'float': function(value) {
			return '"' + value + '"^^xsd:float';
		},

		'date': function(value) {
			return '"'+moment(value).format("YYYY-MM-DD")+'"^^xsd:date';
		},

		datetime: function(value) {
			return '"'+moment(value).format("YYYY-MM-DDTHH:mm:ssZ")+'"^^xsd:dateTime';
		},

		'binary': function(value) {


		},

		'array': function(value) {

		},

		'json': function(value) {

		}
	}
}
