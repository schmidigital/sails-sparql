var moment = require('moment');

module.exports = {
	fromSparql: {
		boolean: function(value) {
			return value === 'true';
		},
		// TODO Null richtig parsen / inserten
		integer: function(value) {
			if (value != "null")
				return value - 0;

			return null;
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
			return JSON.parse(value);
		},

		'array': function(value) {
			return JSON.parse(value);
		},

		'json': function(value) {
			return JSON.parse(value);
		}

	},
	toSparqlInsert: {
		boolean: function(value) {
			if(value===null)
				return 'null';
			return '"' + value + '"^^xsd:boolean';
		},
		integer: function(value) {
			if(value===null)
				return '"' + "null" + '"';
			return '"' + value + '"^^xsd:integer';
		},
		string: function(value) {
			return JSON.stringify(value);
		},

		text: function(value) {
			return JSON.stringify(value);
		},

		'float': function(value) {
			if(value===null)
				return 'null';
			return '"' + value + '"^^xsd:float';
		},

		'date': function(value) {
			if(value===null)
				return 'null';
			return '"'+moment(value).format("YYYY-MM-DD")+'"^^xsd:date';
		},

		datetime: function(value) {
			if(value===null)
				return 'null';
			return '"'+moment(value).format("YYYY-MM-DDTHH:mm:ssZ")+'"^^xsd:dateTime';
		},

		'binary': function(value) {
			return JSON.stringify(JSON.stringify(value));
		},

		'array': function(value) {
			return JSON.stringify(JSON.stringify(value));
		},

		'json': function(value) {
			return JSON.stringify(JSON.stringify(value));
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
			return JSON.stringify(value);
		},

		text: function(value) {
			return JSON.stringify(value);
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
			return JSON.stringify(JSON.stringify(value));
		},

		'array': function(value) {
			return JSON.stringify(JSON.stringify(value));
		},

		'json': function(value) {
			return JSON.stringify(JSON.stringify(value));
		}
	}
}
