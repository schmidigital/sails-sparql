var _ = require('lodash'),
	util = require('util'),
	async = require('async'),
	colors = require('colors'),
	jsesc = require('jsesc'),
	shared = require('./shared');
//  Stardog = require('stardog');

// Debug Output Control
var debug = {
	insert: false,
	define: false,
	delete: false,
	query: false,
	endpoint: false
}

/*
 *     Default Classes
 */
var literalClasses = ['type.text', 'rdfs:Literal', 'xsd:string'];

var modifiers = {
	'or': true,
	'and': true,
	'&': true,
	'contains': true,
	'not': true,
	'!': true
};




var sparrow = module.exports = {

	ensure_prefix: function(uri, prefix) {
		var patt = new RegExp(":");
		var res = patt.test(uri);
		if (!res) {
			return prefix + uri;
		} else {
			return uri;
		}
	},

	/*
	 *   Check, if condition is a Literal or an URI
	 */
	//var rangeIsLiteral = function(condition) {
	//  if (_.indexOf(literalClasses, properties[condition].range) >= 0) {
	//    return true
	//  }
	//  else {
	//    return false
	//  }
	//}

	_query: function(conn, query, options, cb) {

		query = "DEFINE input:inference <" + conn.definition + "> \n" +
			"prefix " + conn.prefix.abr + " <" + conn.prefix.val + ">  \n" + query;

		// Add Limit if not given
		query += "LIMIT " + (options.limit || 20)

		if ('function' == typeof options) {
			cb = options;
		}

		if (debug.query == true) {
			console.log("######### Query Start #########".cyan);
			console.log(query);
			console.log("######### Query End #########".cyan);
		}


		conn.connection.rows(query, function(err, res) {
			cb(null, res);
		})


		// Stardog
		//  conn.connection.onlineDB({ database: conn.database, strategy: "NO_WAIT" }, function () {
		//    conn.connection.query({
		//      database: conn.database,
		//      mimetype: options.mimetype || "application/sparql-results+json", //TODO Custom Mimetypes angeben
		//      query: query,
		//      limit: options.limit || 20,
		//      offset: 0
		//    }, function (data, response) {
		//      return cb(null, data);
		//    });
		//  });
	},

	_insert: function(conn, triples, options, cb) {

		// Check if we have options
		if (typeof options == 'function') {
			cb = options;
		}

		// Set the graph to delete from
		var graph = options.graph || conn.database;

		// Create the Query
		var query = "prefix " + conn.prefix.abr + " <" + conn.prefix.val + ">  \n";
		query += "INSERT DATA { GRAPH <" + graph + "> {\n";
		query += triples;
		query += "\n}\n}";

		if (debug.insert == true ) {
			console.log("\n######### Insert Start #########".green);
			console.log(query);
			console.log("######### Insert End #########\n".green);
		}

		// Go for it!
		conn.connection.query(query, function(err, res) {
			// Everything is alright!
			if (!err) {
				cb(null);
			} else {
							console.log("Error!".red);
				      console.log(err);
				      console.log("Status Code: " + res.statusCode)
				cb(err, null)
			}
		});

		// Stardog
		//  var txId = null;
		//  conn.connection.onlineDB({ database: conn.database, strategy: "NO_WAIT" }, function () {
		//    conn.connection.begin({ database: conn.database }, function (body, response) {
		//				// Our new awesome transaction id
		//				txId = body;
		//				conn.connection.addInTransaction(
		//					{ database: conn.database, "txId": txId, "body": triples, contentType: "text/turtle" },
		//					function (body2, response2) {
		//						conn.connection.commit({ database: conn.database, "txId": txId }, function (body3, response3) {
		//							cb(null)
		//						});
		//					}
		//				);
		//			});
		//		});
	},

	_delete: function(conn, triples, options, cb) {


		if ('function' == typeof options) {
			cb = options;
		}

		// Set the graph to delete from
		var graph = options.graph || conn.database;

		// Create the Query
		var query = "prefix " + conn.prefix.abr + " <" + conn.prefix.val + ">  \n";



		// Simple delete of data
		if (!options.where) {
			query += "DELETE DATA { GRAPH <" + graph + "> {\n";
			query += triples;
			query += "\n}\n}";
		}
		// Deletion with condition
		else {
			query += "DELETE { GRAPH <" + graph + "> {\n";
			query += triples;
			query += "\n}\n} ";

			query += "WHERE { GRAPH <" + graph + "> {\n";
			query += options.where;
			query += "\n}\n}";
		}

		if (debug.delete == true) {
			console.log("######### Delete Start #########".red);
			console.log(query);
			console.log("######### Delete End #########".red);
		}

		// Go for it!
		conn.connection.query(query, function(err, res) {
			// Everything is alright!
			if (!err) {
				cb(null);
			} else {
				console.log("Error:");
				//console.log(err);
				//console.log("Status Code: " + res.statusCode)
				cb(err, null)
			}
		});

		// Stardog
		//  conn.connection.begin({ database: conn.database }, function (body, response) {
		//    var txId = body;
		//
		//    conn.connection.removeInTransaction(
		//      { database: conn.database, "txId": txId, "body": triples, contentType: "text/turtle" },
		//      function (bodyR, responseR) {
		//        conn.connection.commit(
		//          { database: conn.database, "txId": txId },
		//          function (bodyCD, responseCD) {
		//            cb();
		//          });
		//      }
		//    );
		//  });
	},


	_select: function(connection, collection, options) {

		var conn = shared.connections[connection];
		var coll = shared.collections[collection];

		var select_clause = "SELECT DISTINCT "; // TODO Ist das die Ideal Lösung?

		// Iterate through the attributes to select
		for (attribute in coll._attributes) {
			// Special Case: Get the ID
			if (attribute != "id") {
				select_clause += "?" + coll.adapter.identity + "_" + attribute + " ";
			} else {
				select_clause += '(str(?1) AS ?' + coll.adapter.identity + '_' + attribute + ')';
			}
		}

		// Select the proper databases to take the data from
		// TODO v2 Insert/Select the Models in special graphs. e.G. Posts in graph mindbabble.post etc.

		var graph = options.graph || conn.database;
		select_clause += " FROM <" + graph + "> "


		return select_clause;
	},

	_where: function(connection, collection, options) {
		var lang = options.lang || "de";

		var conn = shared.connections[connection];
		var coll = shared.collections[collection];

		var where_clause = "WHERE {";

		// The Graph we select from can differ
		where_clause = "GRAPH <" + (options.graph || conn.database) + "> {";

		/*
		 *   Check for Sub Objects (Important for decision to use SubSelect or not)
		 */
		var check_nested_obj = function(branch) {
			for (var subbranch in branch) {
				if (typeof branch[subbranch] == 'object') {
					return true;
				}
			}
		}


		/*
		 *  Rekursive Deep Funktion, um eine Tiefensuche im Graph durchzuführen
		 *  @param
		 *    branch: Enthält den aktuellen Zweig des JSON Objekts
		 *    parent_condition: Die aktuelle Bedingung, z.B. username, tags oder topic...
		 *    deep_collection: Die aktuelle Collection
		 */
		function deep(branch, parent_condition, deep_collection, stack, offset) {

			var i = 1;

			stack = stack || i;

			deep_collection = sparrow.ensure_prefix(deep_collection, conn.prefix.abr);


			// Iterate through conditions
			for (var condition in branch) {



				/*******************************
				 *
				 * Check modifiers
				 *
				 * *****************************
				 */
				if (modifiers[condition]) {
					switch (condition) {
						case "&":
						case "and":
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


							break;
						case "!":
						case "not":
							//						console.log("not!");
							//						console.log(branch);
							//						console.log(parent_condition);
							//						console.log(deep_collection);

							// Check, if the range is a literal
							if (shared.properties[deep_collection + "." + parent_condition] && _.indexOf(literalClasses, shared.properties[deep_collection + "." + parent_condition].range) >= 0) {
								where_clause += "FILTER ( ?" + stack + " != '" + branch[condition] + "')\n";
							}
							// range is a URI
							else {
								var uri = sparrow.ensure_prefix(branch[condition], conn.prefix.abr);

								where_clause += "FILTER ( ?" + stack + " != " + uri + ")\n";
							}

							// TODO
							// Not In Operator. Giving an array

							break;
						case "contains":
							where_clause += "?" + stack + " bif:contains \"'" + branch[condition] + "'\" .\n";
							break;
					}
				}

				/*
				 Check for properties
				 */
				else if (shared.properties[deep_collection + "." + condition] || condition == "id") {

					/*
					 Check alternative label names and set the right attribute property name.
					 Default is attribute name, alternative is defined in the "as" property.
					 */
					var condition_property = (coll._attributes[condition] && coll._attributes[condition].as ? coll._attributes[condition].as : deep_collection + "." + condition)


					// Branch is an array
					if (Array.isArray(branch[condition])) {

						// Special Case ID
						if (condition != "id") {
							// Is the condition available or are you just kidding me?
							// Am I the ID?
							where_clause += "\n" + "?" + stack + " ";

							// Check, if the range is a literal
							if (shared.properties[deep_collection + "." + condition] && _.indexOf(literalClasses, shared.properties[deep_collection + "." + condition].range) >= 0) {

								// TODO Implement different language possibilities
								//                console.log(shared.properties[deep_collection + "." + condition])

								// If the value is multilanguage, use the language appendix!
								//              console.log(shared.properties[deep_collection + "." + condition])
								var language_appendix = (shared.properties[deep_collection + "." + condition].multilang ? '"@' + lang : '"')


								for (cond in branch[condition]) {
									where_clause += condition_property + ' "' + branch[condition][cond] + language_appendix + ' .\n';
								}

							}
							// range is a URI
							else {
								for (cond in branch[condition]) {
									var uri = sparrow.ensure_prefix(branch[condition][cond], conn.prefix.abr);
									where_clause += condition_property + ' ' + uri + ' .\n';
								}
							}

						} else {

							var id = sparrow.ensure_prefix(branch[condition], conn.prefix.abr);;
							where_clause += '\nBIND (' + id + ' AS ?' + stack + ')\n';
						}
					}

					// Branch is an object
					else if (typeof branch[condition] == "object") {
						//              console.log("Collection: " + deep_collection)
						//              console.log("Condition: " + deep_collection + "." + condition)
						//              console.log("Property: ")
						//              console.log(shared.properties[deep_collection + "." + condition])
						//              console.log("Range: " + shared.properties[deep_collection + "." + condition].range)
						//              console.log("=====")

						/*
						 *   Check for Sub Objects (Important for decision to use SubSelect or not)
						 */
						var has_nested_obj = check_nested_obj(branch[condition])

						var range = (condition != "id" ? shared.properties[deep_collection + "." + condition].range : deep_collection);

						i = (offset ? i + offset : i);

						var newstack = stack;

						// Check for id
						if (condition != "id") {

							where_clause += "\n" + "?" + stack + " ";
							where_clause += condition_property + " ?" + stack + '_' + i + " .\n";

							// Only increase stack, if attribute is not the id
							newstack = stack + '_' + i;
						}

						if (has_nested_obj) {
							// Deep Query
							where_clause += "{\n " + "SELECT * WHERE {";

							deep(branch[condition], condition, range, newstack);

							where_clause += "\n" + "}\n}\n";
						} else {
							deep(branch[condition], condition, range, newstack);
						}
					}
					// Wert ist ein String oder Array
					else if (typeof branch[condition] == "string") {
						// Special Case ID
						if (condition != "id") {
							// Is the condition available or are you just kidding me?
							// Am I the ID?
							where_clause += "\n" + "?" + stack + " ";

							// Check, if the range is a literal
							if (shared.properties[deep_collection + "." + condition] && _.indexOf(literalClasses, shared.properties[deep_collection + "." + condition].range) >= 0) {

								// TODO Implement different language possibilities
								//                console.log(shared.properties[deep_collection + "." + condition])

								// If the value is multilanguage, use the language appendix!
								//              console.log(shared.properties[deep_collection + "." + condition])
								var language_appendix = (shared.properties[deep_collection + "." + condition].multilang ? '"@' + lang : '"')
								where_clause += condition_property + ' "' + branch[condition] + language_appendix + ' .\n';
							}
							// range is a URI
							else {
								var uri = sparrow.ensure_prefix(branch[condition], conn.prefix.abr);
								where_clause += condition_property + ' ' + uri + ' .\n';
							}
						} else {

							var id = sparrow.ensure_prefix(branch[condition], conn.prefix.abr);;
							where_clause += '\nBIND (' + id + ' AS ?' + stack + ')\n';
						}
					}
				} else {
					console.log("Property not valid!".red)
					console.log(condition)
				}

				// Only iterate iterator_y if the loop runs more than one time
				i++;
			}


			/*
			 TODO: Dieser Part sollte pro Ebene nur einmal angezeigt werden
			 */
			if (i == 1) {
				where_clause += '\n?' + stack + ' a ' + deep_collection + ' .';
			}

		}

		deep(options.where, "", collection);

		/*
		 *   ATTRIBUTES
		 */
		for (attribute in coll._attributes) {
			if (attribute != "id") {
				// Check alternative label names and set the right attribute property name, default is attribute name
				var attribute_property = (coll._attributes[attribute].as ? coll._attributes[attribute].as : conn.prefix.abr + collection + "." + attribute)

				// Exclude foreign models as they are caught with the .populate method
				if (!coll._attributes[attribute].collection) {
					where_clause += "\nOPTIONAL { " + "?1" + ' ' + attribute_property + " " + "?" + coll.adapter.identity + "_" + attribute + ' .\n';

					// Exclude languages other than the given one
					if (shared.properties[conn.prefix.abr + collection + "." + attribute] && _.indexOf(literalClasses, shared.properties[conn.prefix.abr + collection + "." + attribute].range) >= 0 && shared.properties[conn.prefix.abr + collection + "." + attribute].multilang) {
						where_clause += 'FILTER langMatches( lang(?' + coll.adapter.identity + "_" + attribute + '), "' + lang + '")\n'
					}

					where_clause += "}\n"
				}

			}
		}

		// Close GRAPH {
		where_clause += "}";

		// Close WHERE {
		where_clause += "}";

		return where_clause;
	},


	/*
	 * Looks in the object for properties and looks up if the are valid + which expected type they have
	 */
	//var _validateProperties = function(obj) {
	//
	//  var properties_to_lookup = [];
	//
	//  /*
	//   TODO: Types und Properties zwischen Cashen zur Pre Validierung
	//   TODO: Extra Datei (Klasse) anlegen, welche das handlen.
	//   TODO: Auto push in Literal Classes
	//   */
	//
	//
	//  function deep (branch) {
	//    // Iterate through conditions
	//    for (condition in branch) {
	//      // If the condition is not saved yet, look it up later
	//      if (!properties[condition]) {
	//        console.log(condition.children)
	//        properties_to_lookup.push(condition)
	//      }
	////      if (["rdf:type", "a"] )
	//    }
	//
	//    return true;
	//  }
	//
	//  deep(obj);
	//};

	/*
	 *
	 */
	/**
	 *
	 * Converts the JSON results of the SPARQL Query to waterline model
	 *
	 * @param {results}  raw_data  Array of the SPARQL Query results
	 */
	json_to_model: function(connection, collection, raw_data) {

		var conn = shared.connections[connection];
		var coll = shared.collections[collection];

		// If we have no array, convert it to an array
		//  results = raw_data.results.bindings; // Stardog
		results = raw_data; // Virtuoso

		if (!Array.isArray(results)) {
			var tmp_results = _.cloneDeep(results);
			delete(results);
			results = [tmp_results];
		}


		var models = [];

		// Iterate models
		for (result in results) {
			var res = results[result];
			// the new object
			var obj = {};

			// Map each attribute
			for (attribute in res) {

				// Set proper attribute name
				var attribute_name = attribute.replace(coll.adapter.identity + "_", '');

				// Filter out special languages
				//if (res[attribute]["xml:lang"]) {
				//	if(res[attribute]["xml:lang"] == "en") {
				//		obj[attribute_name] = res[attribute].value;
				//	}
				//} else {
				obj[attribute_name] = res[attribute].value;

				//Special Case ID & URIs
				if (attribute_name == "id") {
					obj[attribute_name] = obj[attribute_name].replace(conn.prefix.val, '')
				}
				if (res[attribute].type == "uri") {
					obj[attribute_name] = obj[attribute_name].replace(conn.prefix.val, '')
				}
				//}

			}

			models.push(obj)
		}


		return models;
	},


	/**
	 *
	 * Converts a waterline model to turtle format
	 *
	 * @param {Function}  values  Callback function to call after all is done
	 */
	model_to_turtle: function(connection, collection, values, options) {


		if (!options) {
			options = {}
		}

		var conn = shared.connections[connection];
		var prefix = conn.prefix.abr;


		var attributes = shared.collections[collection]._attributes;
		var triples = "";


		// If we have no array, convert it to an array
		if (!Array.isArray(values)) {
			var tmp_models = _.cloneDeep(values);
			delete(values)
			values = [tmp_models];
		}



		for (value in values) {

			var obj = values[value];


			// Set the ID
			var id = conn.prefix.abr + obj["id"];
			//    var id = convert_with_prefix(obj["id"], conn.prefix);
			triples += id + " ";

			// Ensure, ID exists and has a valid value Adds ID Triple and deletes the ID // TODO Why is ID NaN?
			//    if (obj["id"] !== null && !isNaN(obj["id"])) {
			//      // Extract ID of object and add prefix, then delete id
			//      var id = convert_with_prefix(obj["id"], conn.prefix);
			//      triples += id + " ";
			//    }
			// ID is not given -> Variable
			//    else {
			//      //TODO hier sollte nicht einfach nur ?id stehen, sonst ist das ID abh#ngig zur where funktion
			//      triples += "?id "
			//    }

			/* Prevent ID from getting listed, RDF has no IDs as attribuest,
			 *  the entity itself is the id. Example (6f93a12is the ID): <user.m.6f93a12> <has_name> <Goofy>
			 */
			//    delete obj["id"];


			var i = 0;
			end = ";";

			// If we want to make delete triples, don't include the ID
			if (options.update || options.create) {
				delete(obj.id)
			}

			// If we want to create or destroy a object, also the type to it
			if (options.create || options.delete) {
				var property = "a ";

				triples += property + conn.prefix.abr + collection + ";\n"
			}


			// Iterate all elements in the obj and convert each one to a triple
			for (property in obj) {
				if (i == Object.keys(obj).length - 1) end = ".";

				// If we want to have triples for delete, ignore the ID
				/* If attributes is a reference (IRI)
				 *  e.G. <alex> <has_interest> <freestyle>
				 */

				// Variable to check if we found the property inside a attribute's key
				var columnName;

				// Suche, ob die Property in den Attributen vorkommt
				if (attributes[property] || (columnName = _.findKey(attributes, {
						columnName: property
					}))) {

					// Property auf "as" Attribut ändern, falls dieses vorhanden ist.
					//var property_string = (attributes[property].as) ? attributes[property].as : prefix + collection + "." + property;

					// TODO as brauchen wir nicht, da es dafür tableName gibt! Anpassen in den Models :-)
					var property_key = (columnName) ? columnName : property;
					var property_string = prefix + collection + "." + property;

					//var value = jsesc(obj[property], {'quotes': 'double'})

					//console.log(attributes[property_key].model);

					// If we don't have a foreign relation, we insert the datatype property in bracelets
					if (!(attributes[property_key].model || attributes[property_key].collection)) {

						// sanitize the value, so the db likes our string. makes e.G. "He I'm here" to "He I\'m here".
						var value = obj[property]


						//console.log("JOOOOOOOOOOOOOOO".yellow);
						//console.log(property);
						//console.log(obj[property]);
						//console.log(typeof obj[property] === "string");

						// TODO Later: In C schreiben
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

						if (typeof obj[property] === "string") {
							value = escape(value);
						}

						triples += property_string + ' "' + value + '" ' + end + '\n';

					// If we have a foreign relationship, we go here
					} else {
						var foreign = attributes[property_key];

						//          console.log("shared.collections")
						//          console.log(foreign.model || foreign.collection)
						//          console.log(shared.collections[foreign.model || foreign.collection])

						//					var external_connections = shared.collections[foreign.model || foreign.collection].connections;
						var external_prefix = "mb:";

						// TODO We assume, there is only one connection in a model and so only one prefix
						//					for (external_connection in external_shared.connections) break;
						//					external_prefix = shared.connections[external_connection].prefix.abr;

						triples += property_string + ' ' + external_prefix + obj[property] + end + '\n';
					}
				} else {
					console.log("Property not found!".red)
					console.log("-> " + property)
				}

				i++;
			}
		}

		return triples;
	}

};
