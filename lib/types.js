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
			console.log(value);

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
			return moment(value,'YYYY-MM-DD').toDate();
		},

		datetime: function(value) {
			return moment(value).toDate();
		},

		'binary': function(value) {


		},

		'array': function(value) {

		},

		'json': function(value) {

		}

	},
	toSparqlInsert: {
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
	},
	toSparqlQuery: {
		boolean: function(value) {
			return value;
		},
		integer: function(value) {
			return value;
		},
		string: function(value) {
			return '"' + escape(value) + '"';
		},

		text: function(value) {
			return '"' + escape(value) + '"';
		},

		'float': function(value) {
			return value;
		},

		'date': function(value) {
			return '"'+moment(value).format("YYYY-MM-DD");
		},

		datetime: function(value) {
			return '"'+moment(value).format("YYYY-MM-DDTHH:mm:ssZ");
		},

		'binary': function(value) {

		},

		'array': function(value) {

		},

		'json': function(value) {

		}
	}
}
