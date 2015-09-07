var _ = require('lodash'),
    util = require('util'),
    async = require('async'),
    colors = require('colors'),
    jsesc = require('jsesc'),
    shared = require('./shared'),
    stardog = require('stardog'),
    types = require('./types');

var log = function (o) {
    console.log(o);
};

// Debug Output Control
var debug = {
    insert: true,
    define: false,
    delete: false,
    query: true,
    endpoint: false
};

/*
 *     Default Classes
 */
var literalClasses = ['type.text', 'rdfs:Literal', 'xsd:string'];

var modifiers = {
    'or': true,
    'and': true,
    '&': true,
    'like': true,
    '!': true,
    'not': true,
    '<=': true,
    '<': true,
    '>': true,
    '>=': true,
    'lessThanOrEqual': true,
    'lessThan': true,
    'greaterThanOrEqual': true,
    'greaterThan': true,
    'contains': true,
    'startsWith': true,
    'endsWith': true
};


//var modifiers_datatype = {
//	'!': true,
//	'not': true,
//	'<=': true,
//	'<': true,
//	'>': true,
//	'>=': true,
//	'lessThanOrEqual': true,
//	'lessThan': true,
//	'greaterThanOrEqual': true,
//	'greaterThan': true,
//	'contains': true,
//	'startsWith': true,
//	'endsWith': true,
//}


var sparrow = module.exports = {

    ensure_prefix: function (uri, prefix) {
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

    _query: function (conn, query, options, cb) {

        query = "prefix " + conn.prefix.abr + " <" + conn.prefix.val + ">  \n"
			    + query;


        // Add Limit if not given (Only Virtuoso)
        //query += "LIMIT " + (options.limit || 20)

        if ('function' == typeof options) {
            cb = options;
        }


		log(options)

        if (debug.query == true) {
            log("######### Query Start #########".cyan);
            log(query);
            log("######### Query End #########".cyan);
        }


        // Normal SPARQL
        //conn.connection.rows(query, function(err, res) {
        //	cb(null, res);
        //})

        // Stardog
        conn.connection.onlineDB({ database: conn.database, strategy: "NO_WAIT" }, function () {
            conn.connection.query({
                database: conn.database,
                mimetype: options.mimetype || "application/sparql-results+json", //TODO Custom Mimetypes angeben
                query: query,
                limit: options.limit || 20,
                offset: options.skip || 0
            }, function (data, response) {
                return cb(null, data);
            });
        });
    },

    _insert: function (conn, triples, options, cb) {

        // Check if we have options
        if (typeof options == 'function') {
            cb = options;
        }

        // Set the graph to delete from
        var graph = options.graph || conn.database;

        triples = "prefix " + conn.prefix.abr + " <" + conn.prefix.val + "> \n" + triples;

        if (debug.insert == true || (options.define && debug.define)) {
			if (options.define) {
				if (debug.define) {
					log("\n######### Insert Start #########".green);
					log(triples);
					log("######### Insert End #########\n".green);
				}
			}
			else {
				log("\n######### Insert Start #########".green);
				log(triples);
				log("######### Insert End #########\n".green);
			}
        }

        // Stardog
        var txId = null;
        conn.connection.onlineDB({ database: graph, strategy: "NO_WAIT" }, function () {
            conn.connection.begin({ database: graph }, function (body, response) {

                // Our new awesome transaction id
                txId = body;
                conn.connection.addInTransaction(
                    { database: graph, "txId": txId, "body": triples, contentType: "text/turtle" },
                    function (body2, response2) {

                        conn.connection.commit({ database: graph, "txId": txId }, function (body3, response3) {

                            cb(null)
                        });
                    }
                );
            });
        });
    },

    _delete: function (conn, triples, options, cb) {


        if ('function' == typeof options) {
            cb = options;
        }

        // Set the graph to delete from
        var graph = options.graph || conn.database;

        // Create the Query
        var query = "prefix " + conn.prefix.abr + " <" + conn.prefix.val + ">  \n";


        // Simple delete of data
        if (!options.where) {
            query += "DELETE DATA {\n";
            query += triples;
            query += "\n}";
        }
        // Deletion with condition
        else {
            query += "DELETE {\n";
            query += triples;
            query += "\n} ";

            query += "WHERE {\n";
            query += options.where;
            query += "\n}";
        }

        if (debug.delete == true) {
            log("######### Delete Start #########".red);
            log(query);
            log("######### Delete End #########".red);
        }

        conn.connection.begin({ database: conn.database }, function (body, response) {
            var txId = body;

            conn.connection.query(
                { database: conn.database, "txId": txId, "query": query, contentType: "text/turtle" },
                function (bodyR, responseR) {
                    log(bodyR);

                    conn.connection.commit(
                        { database: conn.database, "txId": txId },
                        function (bodyCD, responseCD) {
                            log(bodyCD);

                            cb();
                        });
                }
            );
        });
    },


    _select: function (connection, collection, options) {

        var conn = shared.connections[connection];
        var coll = shared.collections[collection];
		var attributes = coll._attributes;

        var select_clause = "SELECT DISTINCT "; // TODO Ist das die Ideal Lösung?

		// Check if we have group by or aggregate functions, so we don't need additional fields
		if (!(options.groupBy || options.sum || options.average	|| options.max || options.min)
		) {
			// Iterate through the attributes to select
			// TODO. Custom Select
			//for (attribute in coll._attributes) {

			// First check if we want to select this attribute
			if (options.select) {

				_.each(options['select'], function (val, key) {
					// Special Case: Get the ID
					if (val != "id") {
						select_clause += "?" + coll.adapter.identity + "_" + val + " ";
					} else {
						select_clause += '(str(?1) AS ?' + coll.adapter.identity + '_' + val + ')';
					}
				});

				if (options.sort) {
					_.each(options['sort'], function (val, key) {
						// Special Case: Get the ID
						if (key != "id") {
							select_clause += "?" + coll.adapter.identity + "_" + key + " ";
						} else {
							select_clause += '(str(?1) AS ?' + coll.adapter.identity + '_' + key + ')';
						}
					});
				}

			}

			else {
				for (attribute in coll._attributes) {
					if (attribute != "id") {
						select_clause += "?" + coll.adapter.identity + "_" + attribute + " ";
					} else {
						select_clause += '(str(?1) AS ?' + coll.adapter.identity + '_' + attribute + ')';
					}
				}
			}


			//}
		}
		// We have a groupby or aggregate functions
		else {
			if (options.sum) {
				_.each(options["sum"], function(attr) {
					if (attributes[attr]) {
						select_clause += "(SUM(?" + coll.adapter.identity + "_" + attr + ") AS ?" + coll.adapter.identity + "_" + attr  + "_calc) ";
					}
				});
			}
			if (options.max) {
				_.each(options["max"], function(attr) {
					if (attributes[attr]) {
						select_clause += "(MAX(?" + coll.adapter.identity + "_" + attr + ") AS ?" + coll.adapter.identity + "_" + attr  + "_calc) ";
					}
				});
			}
			if (options.min) {
				_.each(options["min"], function(attr) {
					if (attributes[attr]) {
						select_clause += "(MIN(?" + coll.adapter.identity + "_" + attr + ") AS ?" + coll.adapter.identity + "_"  + attr + "_calc) ";
					}
				});
			}
			if (options.average) {
				_.each(options["average"], function(attr) {
					if (attributes[attr]) {
						select_clause += "(AVG(?" + coll.adapter.identity + "_" + attr + ") AS ?" + coll.adapter.identity + "_" + attr  + "_calc) ";
					}
				});
			}
			if (options.groupBy) {
				_.each(options["groupBy"], function(attr) {
					if (attributes[attr]) {
						select_clause += "?" + coll.adapter.identity + "_" + attr + " ";
					}
				});
			}
		}

        // Select the proper databases to take the data from
        // TODO v2 Insert/Select the Models in special graphs. e.G. Posts in graph mindbabble.post etc.

        var graph = options.graph || conn.database;


        return select_clause;
    },

    _where: function (connection, collection, options) {
        var lang = options.lang || "de";


        var conn = shared.connections[connection];
        var coll = shared.collections[collection];
		var attributes = shared.collections[collection]._attributes;


		var where_clause = "WHERE {";

        /*
         *   Check for Sub Objects (Important for decision to use SubSelect or not)
         */
        var check_nested_obj = function (branch) {
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

            var deep_collection_original = deep_collection;
            var deep_collection_attributes = shared.collections[deep_collection]._attributes;

            //console.log(deep_collection_attributes);


            //deep_collection = sparrow.ensure_prefix(deep_collection, conn.prefix.abr);


            // Iterate through conditions
            for (var condition in branch) {

                /*******************************
                 *
                 * Check for modifiers
                 *
                 * *****************************
                 */
                // TODO: Modifiers auslagern in Datei
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
						case "or":
							var j = 0;

							// Gehe alle and-conditions durch
							for (var or_condition in branch[condition]) {

								// Speichere den jeweiligen and_branch ab
								var or_branch = branch[condition][or_condition];

								// Prüfe, ob der Branch noch weitere Unterobjekte hat.
								var has_nested_obj = check_nested_obj(or_branch[or_condition]);

								var range = deep_collection;

								where_clause += '\n{';




								if (has_nested_obj) {
									// Deep Query
									where_clause += "{\n " + "SELECT * WHERE {";

									deep(or_branch, condition, range, stack, j);

									where_clause += "\n" + "}\n}\n";
								} else {
									// TODO: Genaues Konzept mit i und j
									deep(or_branch, condition, range, stack, i);
								}

								where_clause += '\n}';

								i++;
								j++;

								// If we not arrived the last element, we must add the UNION term
								if (j < Object.keys(branch[condition]).length) {
									where_clause += "\nUNION "
								}
							}


							break;
                        case "!":
                        case "not":
                            //						log("not!");
                            //						log(branch);
                            //						log(parent_condition);
                            //						log(deep_collection);

                            // Check, if the property is allowed and if the range is a literal
                            if (deep_collection_attributes[parent_condition]) {

                                var type = deep_collection_attributes[parent_condition].type;

								log(type)

                                // Attribute has a type, so we have a Datatype Property
                                if (type) {
                                    var value = branch[condition];

									// We need to "pre_tune" the value to fit into the query
									var query_value = value;

									var new_stack = stack;

									// If we get an array, we have NOT IN
									if (Array.isArray(branch[condition])) {

										// Overwrite old query value
										query_value = "IN ("

										var seperator = ',';
										var i = 0;

										// Set all values for the IN query
										_.each(branch[condition], function(val, key) {
											i++;

											if (i == branch[condition].length) seperator = "";
											query_value += 'LCASE(' + types.toSparqlQuery[type](val) + ')' + seperator;
										});

										query_value += ")";



										// If we have type text or string, we have to LowerCase
										new_stack = (type == 'string' || type == "text") ? "LCASE(?" + stack + ") " : "?" + stack;

										where_clause += "FILTER ( " + new_stack + " NOT " + query_value + ")\n";
									}

									// Value is a string
									else {
										new_stack = (type == 'string' || type == "text") ? "LCASE(?" + stack + ") " : "?" + stack;

										where_clause += "FILTER ( " + new_stack + " != " + types.toSparqlQuery[type](value) + ")\n";
									}

									  //if(value!==null)
								  		//else
								//    where_clause  += "FILTER EXISTS { id prop ?"+stack+"}\n";
                                }

                                // Attribute has no type, so we have a Object Property
                                else {
                                    var uri = sparrow.ensure_prefix(branch[condition], conn.prefix.abr);

                                    where_clause += "FILTER ( ?" + stack + " != " + uri + ")\n";
                                }
                            }
                            else {
                                console.log("Property not allowed!");

                            }

                            // TODO
                            // Not In Operator. Giving an array

                            break;
                        case "contains":
							// Virtuoso
                            //where_clause += "?" + stack + " bif:contains \"'" + branch[condition] + "'\" .\n";
							var type = deep_collection_attributes[parent_condition].type;

							log("iiii")
							log(i)

							where_clause += 'FILTER (CONTAINS(LCASE(?' + stack + '), LCASE(' + types.toSparqlQuery[type](branch[condition]) + '))) .';
                            break;
						/*
						 * Be careful, there are 2 cases
						 * 1) where: { first_name: { like: '%hete%' } }
						 * 2) where: { like: { first_name: '%hete%' } }
						 *
						 */
						case "like":
							//console.log("parent", parent_condition)
							//console.log("child", condition)
							// Get the attribute
							for (attribute in branch[condition]) break;

							var string;
							var newstack = stack;

							// If we have no attribute as a child it must be the parent! holy mother!
							if (attribute != 0) {
								string = branch[condition][attribute];
								where_clause += "?" + stack + " " + conn.prefix.abr + collection + "." + attribute + " " + "?" + stack + "_" + i + ' .\n';
								newstack = stack + "_" + i
							} else {
								attribute = parent_condition;
								string = branch[condition];
							}

							console.log("attribute", attribute)


							// Todo, Startswith und Endswith easy
							log("########## ATTRIBUTE", attribute)
							var type = deep_collection_attributes[attribute].type;
							var val = types.toSparqlQuery[type](string).replace(/\%/g, '')

							// Both directions
							if (string.charAt(0) === "%" && string.slice(-1) == "%") {
								where_clause += "FILTER (CONTAINS(LCASE(?" + newstack  + '), LCASE(' + val  + '))) .';
							}
							// Starts With
							else if (string.slice(-1) === "%") {
								where_clause += "FILTER (STRSTARTS(LCASE(?" + newstack + '), LCASE(' + val  + '))) .';
							}
							else if (string.charAt(0) == "%") {
								where_clause += "FILTER (STRENDS(LCASE(?" + newstack  + '), LCASE(' + val  + '))) .';
							}

							break;
						case "startsWith":
							log(parent_condition)
							var type = deep_collection_attributes[parent_condition].type;
							where_clause += "FILTER (STRSTARTS(LCASE(?" + stack  + '), LCASE(' + types.toSparqlQuery[type](branch[condition]) + '))) .';
							break;
						case "endsWith":
							var type = deep_collection_attributes[parent_condition].type;
							where_clause += "FILTER (STRENDS(LCASE(?" + stack + '), LCASE(' + types.toSparqlQuery[type](branch[condition])  + '))) .';
							break;
                        case "<":
                        case "lessThan":
							var type = deep_collection_attributes[parent_condition].type;
							where_clause += "FILTER (?" + stack + " < " + types.toSparqlQuery[type](branch[condition]) + ") .";
                            break;
                        case ">":
                        case "greaterThan":
							var type = deep_collection_attributes[parent_condition].type;
							where_clause += "FILTER (?" + stack + " > " + types.toSparqlQuery[type](branch[condition]) + ") .";
                            break;
						case "<=":
                        case "lessThanOrEqual":
							var type = deep_collection_attributes[parent_condition].type;
							where_clause += "FILTER (?" + stack + " <= " + types.toSparqlQuery[type](branch[condition]) + ") .";
                            break;
                        case ">=":
                        case "greaterThanOrEqual":
							var type = deep_collection_attributes[parent_condition].type;
							where_clause += "FILTER (?" + stack + " >= " + types.toSparqlQuery[type](branch[condition]) + ") .";
                            break;
                    }
                }

                /*******************************
                 *
                 * So we have no modifier here.
                 * Let's check for Properties
                 *
                 * *****************************
                 */
                // TODO: Anfragen nach Variablen richtig umwandeln, z.B. ?a mb:user.name "Egon" -> ?a mb:user.name "Egon"^^xsd:string

                // Check if we have a valid condition
                //else if (deep_collection_attributes[condition] || condition == "id") {
                else if (deep_collection_attributes[condition]) {


                    /*
                     Check alternative label names and set the right attribute property name.
                     Default is attribute name, alternative is defined in the "as" property.
                     */
                    //var condition_property = (coll._attributes[condition] && coll._attributes[condition].as ? coll._attributes[condition].as : deep_collection + "." + condition)

                    var type = deep_collection_attributes[condition].type;

                    /********************************
                     *
                     *  Attribute is a Datatype Property
                     *  e.g. String, Integer, Date, Boolean etc.
                     *
                     ********************************/
                    if (type in types.toSparqlQuery) {


						/*
						 *
						 * Now we have to check the value of the condition. It can be
						 *
						 * - array: we check for multiple values
						 * - object: we have modifiers or a json object
						 * - string: a concrete value
						 *
						 */


						// Our value is an array, so we have multiple values to look for
						if (Array.isArray(branch[condition])) {

							where_clause += "\n" + "?" + stack + " ";
							where_clause += sparrow.ensure_prefix(deep_collection, conn.prefix.abr) + '.' + condition + ' ?' + stack + '_' + i  + ' .\n';

							where_clause += 'FILTER (LCASE(?' + stack + '_' + i + ') IN (';

							var seperator = ',';
							var i = 0;


							// Set all values for the IN query
							_.each(branch[condition], function(val, key) {
								i++;

								if (i == branch[condition].length) seperator = "";
								where_clause += 'LCASE(' + types.toSparqlQuery['string'](val) + ')' + seperator;
							})

							where_clause += '))'
						}

                        else if (typeof branch[condition] == "object") {

                            var range = deep_collection;

							// If we have an offset, add it to the current stack
                            i = (offset ? i + offset : i);

                            var newstack = stack;

                            // Check for id
                            if (condition != "id") {

                                where_clause += "\n" + "?" + stack + " ";
                                where_clause += sparrow.ensure_prefix(deep_collection, conn.prefix.abr) + "." + condition + " ?" + stack + '_' + i + " .\n";

                                // Only increase stack, if attribute is not the id
                                newstack = stack + '_' + i;
                            }


                            deep(branch[condition], condition, range, newstack);
                        }


                        // Our value is a concrete value
                        else {
                            // If we have a normal attribute
                            if (condition != "id") {

								log("konkret!")
								log(condition)

                                where_clause += "\n" + "?" + stack + " ";

                                //if (shared.properties[deep_collection + "." + condition] && _.indexOf(literalClasses, shared.properties[deep_collection + "." + condition].range) >= 0) {
                                // TODO Implement different language possibilities
                                // If the value is multilanguage, use the language appendix!
                                // log(shared.properties[deep_collection + "." + condition])
                                // var language_appendix = (shared.properties[deep_collection + "." + condition].multilang ? '"@' + lang : '"')
                                // where_clause += condition_property + ' "' + branch[condition] + language_appendix + ' .\n';


								// If we have a string we use the contains function
								if (type == 'string' || type == 'text') {
									where_clause += sparrow.ensure_prefix(deep_collection, conn.prefix.abr) + '.' + condition + ' ?' + stack + '_' + i  + ' .\n';
									where_clause += 'FILTER (CONTAINS(LCASE(?' +  stack + '_' + i  + '), LCASE(' + types.toSparqlQuery[type](branch[condition]) + ')))';
								} else {
									where_clause += sparrow.ensure_prefix(deep_collection, conn.prefix.abr) + '.' + condition + ' ' + types.toSparqlQuery[type](branch[condition])  + ' .\n';
								}

                                // TODO Implement different language possibilities
							}

							// Attribute is the ID
							else {
								var id = sparrow.ensure_prefix(branch[condition], conn.prefix.abr);

								where_clause += '\nBIND (' + id + ' AS ?' + stack + ')\n';
							}
						}
					}

					/********************************
					 *
					 *  Attribute is a Object Property
					 *
					 ********************************/
					else if (deep_collection_attributes[condition].model || deep_collection_attributes[condition].collection) {
						var uri = sparrow.ensure_prefix(branch[condition], conn.prefix.abr);
						where_clause += condition_property + ' ' + uri + ' .\n';
					}

					// Branch is an array.
					// So we have an array of values
					//else if (Array.isArray(branch[condition])) {
					//
					//    // condition is not the ID
					//    if (condition != "id") {
					//        // Is the condition available or are you just kidding me?
					//        // Am I the ID?
					//        where_clause += "\n" + "?" + stack + " ";
					//
					//        // Check, if the range is a literal
					//        if (shared.properties[deep_collection + "." + condition] && _.indexOf(literalClasses, shared.properties[deep_collection + "." + condition].range) >= 0) {
					//
                    //            // If the value is multilanguage, use the language appendix!
                    //            //              log(shared.properties[deep_collection + "." + condition])
                    //            var language_appendix = (shared.properties[deep_collection + "." + condition].multilang ? '"@' + lang : '"')
                    //
                    //
                    //            for (cond in branch[condition]) {
                    //                where_clause += condition_property + ' "' + branch[condition][cond] + language_appendix + ' .\n';
                    //            }
                    //
                    //        }
                    //        // range is a URI
                    //        else {
                    //            for (cond in branch[condition]) {
                    //                var uri = sparrow.ensure_prefix(branch[condition][cond], conn.prefix.abr);
                    //                where_clause += condition_property + ' ' + uri + ' .\n';
                    //            }
                    //        }
                    //
                    //    }
                    //
                    //    // Property is the id
                    //    else {
                    //
                    //        var id = sparrow.ensure_prefix(branch[condition], conn.prefix.abr);
                    //        where_clause += '\nBIND (' + id + ' AS ?' + stack + ')\n';
                    //    }
                    //}

                    /********************************
                     *
                     * Branch is an object
                     * Means we take use of the deep where function
                     *
                     ********************************/
                    //else if (typeof branch[condition] == "object") {
                    //    //              log("Collection: " + deep_collection)
                    //    //              log("Condition: " + deep_collection + "." + condition)
                    //    //              log("Property: ")
                    //    //              log(shared.properties[deep_collection + "." + condition])
                    //    //              log("Range: " + shared.properties[deep_collection + "." + condition].range)
                    //    //              log("=====")
                    //
                    //    /*
                    //     *   Check for Sub Objects (Important for decision to use SubSelect or not)
                    //     */
                    //    var has_nested_obj = check_nested_obj(branch[condition])
                    //
                    //    var range = (condition != "id" ? shared.properties[deep_collection + "." + condition].range : deep_collection);
                    //
                    //    i = (offset ? i + offset : i);
                    //
                    //    var newstack = stack;
                    //
                    //    // Check for id
                    //    if (condition != "id") {
                    //
                    //        where_clause += "\n" + "?" + stack + " ";
                    //        where_clause += condition_property + " ?" + stack + '_' + i + " .\n";
                    //
                    //        // Only increase stack, if attribute is not the id
                    //        newstack = stack + '_' + i;
                    //    }
                    //
                    //    if (has_nested_obj) {
                    //        // Deep Query
                    //        where_clause += "{\n " + "SELECT * WHERE {";
                    //
                    //        deep(branch[condition], condition, range, newstack);
                    //
                    //        where_clause += "\n" + "}\n}\n";
                    //    } else {
                    //        deep(branch[condition], condition, range, newstack);
                    //    }
                    //}


				}

				/*
				 *
				 * We found no modifiers and no property so it's invalid!
				 *
				 */
				else {
					log("Property not valid!".red)

					console.trace("omg")
					log(condition)
				}

                // Only iterate iterator_y if the loop runs more than one time
                i++;
            }


            /*
             TODO: Dieser Part sollte pro Ebene nur einmal angezeigt werden
             */
            if (i == 1) {
                where_clause += '\n?' + stack + ' a ' + sparrow.ensure_prefix(deep_collection, conn.prefix.abr) + ' .';
            }

        }

        deep(options.where, "", collection);


        /*******************************
         *
         * OPTIONAL Selectors
         * To get the attributes we want.
         *
         * *****************************
         */
        for (attribute in coll._attributes) {
            if (attribute != "id") {

                // Check alternative label names and set the right attribute property name, default is attribute name
                var attribute_property = (coll._attributes[attribute].columnName ? conn.prefix.abr + collection + "." + coll._attributes[attribute].columnName : conn.prefix.abr + collection + "." + attribute)

                // Exclude foreign models as they are caught with the .populate method
                if (!coll._attributes[attribute].collection) {
                    where_clause += "\nOPTIONAL { " + "?1" + ' ' + attribute_property + " " + "?" + coll.adapter.identity + "_" + attribute + ' .';

                    // Exclude languages other than the given one
                    if (shared.properties[conn.prefix.abr + collection + "." + attribute] && _.indexOf(literalClasses, shared.properties[conn.prefix.abr + collection + "." + attribute].range) >= 0 && shared.properties[conn.prefix.abr + collection + "." + attribute].multilang) {
                        where_clause += 'FILTER langMatches( lang(?' + coll.adapter.identity + "_" + attribute + '), "' + lang + '")'
                    }

                    where_clause += "}"
                }

            }
        }

        // Close WHERE {
        where_clause += "}";

		// Do you want to GROUP BY?
		if (options.groupBy) {

			where_clause += " GROUP BY ";

			_.each(options["groupBy"], function(attr) {
				if (attributes[attr]) {
					where_clause += "?" + coll.adapter.identity + "_" + attr + " ";
				}
			});
		}

		// Do we want to sort?
		if (options.sort) {

			where_clause += " ORDER BY ";

			// We want to sort by multiple attributes
			if ("object" === typeof options["sort"]) {
				_.each(options["sort"], function(n, key) {
					if (attributes[key]) {
						where_clause += (n == true) ? "ASC" : "DESC";
						where_clause += "(?" + coll.adapter.identity + "_" + key + ") ";
					}
				});
			}

			// Sort by singe attribute
			else if ("string" === typeof options["sort"]) {
				var sort = options.sort.split(" ");

				// Is the attribute valid?
				if (attributes[sort[0]]) {
					if (!sort[1])
						where_clause += "?" + coll.adapter.identity + "_" + sort[0];
					else if (sort[1] == 1 || sort[1] == "ASC")
						where_clause += "ASC(?" + coll.adapter.identity + "_" + sort[0] + ")";
					else if (sort[1] == 0 || sort[1] == "DESC")
						where_clause += "DESC(?" + coll.adapter.identity + "_" + sort[0] + ")";
				}
			}
		}


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
    //        log(condition.children)
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
    json_to_model: function (connection, collection, raw_data, options) {

        var conn = shared.connections[connection];
        var coll = shared.collections[collection];

        var attributes = shared.collections[collection]._attributes;


		// If we have no array, convert it to an array
        // Stardog
        results = raw_data.results.bindings;

        // Virtuoso
        //results = raw_data; // Virtuoso

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
				// e.g.

				var attribute_name = attribute.replace(coll.adapter.identity + "_", '');

				// handle aggregate variables
				// TODO Aggregates am Anfang checken und globale bool variable setzen, spart zeit
				// TODO Bessere Überprüfung ob das Ergebnis zu GroupBy gehört
				//if (!(options.sum || options.average || options.max || options.min)) {

				// Do we have an aggregate function?
				if (!attributes[attribute_name]) {
					attribute_name = attribute_name.replace("_calc", '');
				}

				var is_valid = true;

				if (options.select) {
					if (options["select"].indexOf(attribute_name) < 0) {
						is_valid = false;
					}
				}

				// Filter out special languages
                //if (res[attribute]["xml:lang"]) {
                //	if(res[attribute]["xml:lang"] == "en") {
                //		obj[attribute_name] = res[attribute].value;
                //	}
                //} else {

				// Set the columName if we have one
				var columnName = attributes[attribute_name].columnName ? attributes[attribute_name].columnName : attribute_name;

				if (is_valid) {
					obj[columnName] = res[attribute].value;

					//log("info###".green)
					//log(attribute)
					//log(res[attribute])
					//log(attributes[attribute_name])
					//log(attributes[attribute_name].columnName)
					//log(attribute_name)

					// Attribute is an object property
					if (res[attribute].type == "uri" || attribute_name == "id") {
						console.log("attribute".yellow)

						log(attribute_name)
						if ()
						obj[columnName] = obj[columnName].replace(conn.prefix.val, '')
					}


					// Attribute is a literal
					else {

						// type der Variable
						var type = attributes[attribute_name].type;


						var value = res[attribute].value;

						// Convert the value to the sails model schema (except for aggregates)
						if (attributes[attribute.replace(coll.adapter.identity + "_", '')]) {
							obj[columnName] = (value === undefined) ? null : types.fromSparql[type](value)
						} else {
							obj[columnName] = types.fromSparql["float"](value);
						}

					}

					// Debug
					//log("####".green);
					//
					//log(attribute_name);
					//log(obj[attribute_name]);
					//log(res[attribute]);
					//log("####".green);


					//}
				}

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
    model_to_turtle: function (connection, collection, values, options) {


        if (!options) {
            options = {}
        }


        var conn = shared.connections[connection];
        var prefix = conn.prefix.abr;


        var attributes = shared.collections[collection]._attributes;
        var triples = "";


        //log('==================')
        //log(attributes)
        //log('==================')

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
                delete obj.id;
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
                if (attributes[property] || (columnName = _.findKey(attributes, { columnName: property }))) {

                    // Property auf "as" Attribut ändern, falls dieses vorhanden ist.
                    //var property_string = (attributes[property].as) ? attributes[property].as : prefix + collection + "." + property;

                    // TODO as brauchen wir nicht, da es dafür tableName gibt! Anpassen in den Models :-) Ist eigentlich erledigt!
                    var property_key = (columnName) ? columnName : property;
                    var property_string = prefix + collection + "." + property;

					log("###".cyan)
					log(property_key)
					log(attributes[property_key])
					log(obj[property]);
					log(obj[property_key]);


					// If we don't have a foreign relation, we insert the datatype property in bracelets
                    if (!(attributes[property_key].model || attributes[property_key].collection)) {

                        // sanitize the value, so the db likes our string. makes e.G. "He I'm here" to "He I\'m here".

                        var value = obj[property]

                        var type = "";


                        //log("JOOOOOOOOOOOOOOO".yellow);
                        //log(property);
                        //log(obj[property]);

                        var type = attributes[property_key].type;
                        if (value === null)
                            console.log(property_key);

                        if (value !== null)
                            triples += property_string + ' ' + types.toSparqlInsert[type](value) + ' ' + end + '\n';

					// If we have a foreign relationship, we go here
                    } else {
                        var foreign = attributes[property_key];

                        //          log("shared.collections")
                        //          log(foreign.model || foreign.collection)
                        //          log(shared.collections[foreign.model || foreign.collection])

                        //					var external_connections = shared.collections[foreign.model || foreign.collection].connections;
                        var external_prefix = "mb:";

                        // TODO We assume, there is only one connection in a model and so only one prefix
                        //					for (external_connection in external_shared.connections) break;
                        //					external_prefix = shared.connections[external_connection].prefix.abr;

                        triples += property_string + ' ' + external_prefix + obj[property] + end + '\n';
                    }
                } else {
                    log("Property not found!".red);
                    log("-> " + property)
                }

                i++;
            }
        }

        return triples;
    },

	/**
	 * Convenience method to grab the name of the primary key attribute,
	 * given the schema.
	 *
	 * @param  {Object} schema
	 * @return {String}
	 * @api private)
	 */
	getPrimaryKey: function (collection) {

		var schema = shared.collections[collection].definition;

		var pkAttrName;
		_.each(schema, function (def, attrName) {
			if (def.primaryKey) pkAttrName = attrName;
		});
		return pkAttrName;
	}

};
