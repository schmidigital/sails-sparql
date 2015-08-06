var m, modifiers = {}, me = module.exports = {};

m = modifiers = {

};

var gt = function(options, result) {

};

var ge = function(options, result) {

};

var lt = function(options, result) {

};

var le = function(options, result) {

};

var not = function(options, result) {

};

var like = function(options, result) {

};

var contains = function(options, result) {

};

var startsWith = function(options, result) {

};

var endsWith = function(options, result) {

};

var and = function(options, result) {
	var j = 0;

	// Gehe alle and-conditions durch
	for (var and_condition in branch[condition]) {

		// Speichere den jeweiligen and_branch ab
		var and_branch = branch[condition][and_condition];

		// Prüfe, ob der Branch noch weitere Unterobjekte hat.
		var has_nested_obj = check_nested_obj(and_branch[and_condition]);

		var range = deep_collection;


		if (has_nested_obj) {
			// Deep Query
			where_clause += "{\n " + "SELECT * WHERE {";

			deep(and_branch, condition, range, stack, j);

			where_clause += "\n" + "}\n}\n";
		} else {
			deep(and_branch, condition, range, stack, j);
		}
		i++;
		j++;
	}
};

var or = function(options, result) {

};

var limit = function(options, result) {

};

var skip = function(options, result) {

};

var where = function(options, result) {

};

m.lessThan = m['<'] = lt;
m.lessThanOrEqual= m['<='] = le;
m.greaterThan= m['>'] = gt;
m.lessThanOrEqual= m['>='] = ge;
m.not = m['!'] = not;
m.like = like;
m.contains = contains;
m.startsWith = startsWith;
m.endsWith = endsWith;
m.limit = limit;
m.skip = skip;
m.where = where;


me.where = function(connection, collection, options) {
	var result = {
		connection: connection,
		collection: collection
	};

}
