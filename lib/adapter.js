//(function (root, factory) {
//  "use strict";
//
//  if (typeof exports === "object") {
//    // NodeJS. Does not work with strict CommonJS, but
//    // only CommonJS-like enviroments that support module.exports,
//    // like Node.
//    module.exports = factory(require("stardog"), require("expect"));
//  } else if (typeof define === "function" && define.amd) {
//    // AMD. Register as an anonymous module.
//    define(["stardog", "expect"], factory);
//  } else {
//    // Browser globals (root is window)
//    root.returnExports = factory(root.Stardog, root.expect);
//  }
//}(this, function (Stardog, expect) {
//  "use strict";
var
	shortid = require('shortid'),
	_ = require('lodash'),
	util = require('util'),
	async = require('async'),
	colors = require('colors'),
	shared = require('./shared'),
	helper = require('./helper'),
	stardog = require('stardog'),
	_runJoins = require('waterline-cursor');


var log = function (o) {
	console.log(o);
};


/**
 * waterline-sails-sparql
 *
 * Most of the methods below are optional.
 *
 * If you don't need / can't get to every method, just implement
 * what you have time for.  The other methods will only fail if
 * you try to call them!
 *
 * For many adapters, this file is all you need.  For very complex adapters, you may need more flexiblity.
 * In any case, it's probably a good idea to start with one file and refactor only if necessary.
 * If you do go that route, it's conventional in Node to create a `./lib` directory for your private submodules
 * and load them at the top of the file with other dependencies.  e.g. var update = `require('./lib/update')`;
 */
module.exports = (function() {


	var defaults = {
		// change these to fit your setup
		endpoint: 'http://localhost:5820',

		prefix: {
			abr: "mb",
			val: "http://mindbabble.com"
		},
		debug: false

		// If setting syncable, you should consider the migrate option,
		// which allows you to set how the sync will be performed.
		// It can be overridden globally in an app (config/adapters.js) and on a per-model basis.
		//
		// drop   => Drop schema and data, then recreate it
		// alter  => Drop/add columns as necessary, but try
		// safe   => Don't change anything (good for production DBs)
		// migrate: 'alter'
	};


	// You may also want to store additional, private data
	// per-connection (esp. if your data store uses persistent
	// connections).
	//
	// Keep in mind that models can be configured to use different databases
	// within the same app, at the same time.
	//
	// i.e. if you're writing a MariaDB adapter, you should be aware that one
	// model might be configured as `host="localhost"` and another might be using
	// `host="foo.com"` at the same time.  Same thing goes for user, database,
	// password, or any other config.
	//
	// You don't have to support this feature right off the bat in your
	// adapter, but it ought to get done eventually.
	//

	var adapter = {

		// Set to true if this adapter supports (or requires) things like data types, validations, keys, etc.
		// If true, the schema for models using this adapter will be automatically synced when the server starts.
		// Not terribly relevant if your data store is not SQL/schemaful.
		//
		// If setting syncable, you should consider the migrate option,
		// which allows you to set how the sync will be performed.
		// It can be overridden globally in an app (config/adapters.js)
		// and on a per-model basis.
		//
		// IMPORTANT:
		// `migrate` is not a production data migration solution!
		// In production, always use `migrate: safe`
		//
		// drop   => Drop schema and data, then recreate it
		// alter  => Drop/add columns as necessary.
		// safe   => Don't change anything (good for production DBs)
		//
		syncable: true,

		schema: false,

		pkFormat: 'string',

		// Default configuration for connections
		defaults: {
			// For example, MySQLAdapter might set its default port and host.
			// port: 3306,
			// host: 'localhost',
			//        schema: true,
			// ssl: false,
			// customThings: ['eh']
		},


		/**
		 *
		 * This method runs when a model is initially registered
		 * at server-start-time.  This is the only required method.
		 *
		 * @param  {[type]}   connection [description]
		 * @param  {[type]}   collection [description]
		 * @param  {Function} cb         [description]
		 * @return {[type]}              [description]
		 */
		registerConnection: function(connection, collection_list, cb) {


			if (!connection.identity) return cb(new Error('Connection is missing an identity.'));
			if (shared.connections[connection.identity]) return cb(new Error('Connection is already registered.'));

			// Add in logic here to initialize connection
			// e.g. shared.connections[connection.identity] = new Database(connection, collections);
			shared.connections[connection.identity] = connection;

			// Virtuoso
			//shared.connections[connection.identity].connection = new sparql.Client(defaults.endpoint)

			// Stardog
			shared.connections[connection.identity].connection = new stardog.Connection();
			shared.connections[connection.identity].connection.setEndpoint( defaults.endpoint);
			shared.connections[connection.identity].connection.setCredentials("admin", "admin");
			shared.connections[connection.identity].connection.setReasoning(true);

			// Deep Clone all the collections
			shared.collections = _.cloneDeep(collection_list);

      //
			//console.log("COLLECTION ############");
			//console.log(shared.collections);
      //
      //
			//for ( var c in shared.collection) {
			//	console.log(c);
			//}


			cb();

		},


		/**
		 * Fired when a model is unregistered, typically when the server
		 * is killed. Useful for tearing-down remaining open connections,
		 * etc.
		 *
		 * @param  {Function} cb [description]
		 * @return {[type]}      [description]
		 */
		// Teardown a Connection
		teardown: function(conn, cb) {

			if (typeof conn == 'function') {
				cb = conn;
				conn = null;
			}
			if (!conn) {
				shared.connections = {};
				return cb();
			}
			if (!shared.connections[conn]) return cb();
			delete shared.connections[conn];
			cb();
		},
		
		//addAttribute: function () {
		//	console.log(123)
		//
		//},
    //
		//removeAttribute: function () {
		//	console.log(123)
		//
		//},

		// Return attributes
		//describe: function(connection, collection, cb) {
    //
		//	var conn = shared.connections[connection];
    //
		//	var query = "SELECT distinct ?property ?range ?type";
		//	query += "WHERE { \n";
		//	query += "{ ?property a owl:DatatypeProperty . } \nUNION";
		//	query += "{ ?property a owl:ObjectProperty . } \n";
		//	query += "{	?property rdfs:domain " + conn.prefix.abr +  collection + " . }\n";
		//	query += "OPTIONAL { ?property rdfs:label ?label } \n"
		//	query += "OPTIONAL { ?property rdfs:range ?range . } \n";
		//	query += "OPTIONAL { ?property a ?type . } \n";
		//	query += "}";
    //
		//	conn.connection.setReasoning(false);
    //
		//	// Hole das angeforderte Objekt
		//	helper._query(conn, query, function(err, data) {
    //
		//		//console.log("result!")
		//		//console.log(data)
    //
    //
		//		//var results = helper.json_to_model(connection, collection, data);
    //
		//		if (err) { return cb(err) }
    //
    //
		//		results = data.results.bindings;
    //
		//		var attributes = {};
    //
		//		_.each(results, function (val) {
    //
		//			var attribute = val["property"].value;
		//			attribute = attribute.replace(conn.prefix.val + collection + ".", '')
    //
		//			attributes[attribute] = val["range"].value;
		//		})
    //
		//		console.log(attributes)
    //
    //
		//		console.log("da haben wir ja was schönes")
    //
		//		conn.connection.setReasoning(true);
    //
		//		return cb(null, attributes);
    //
		//	})
    //
		//},

		/**
		 *
		 * REQUIRED method if integrating with a schemaful
		 * (SQL-ish) database.
		 *
		 * Die Define Funktion erstellt für alle einzelnen Models passende
		 * Datenbank Schema Einträge.
		 * Dadurch werden alle Typen definiert und Properties erstellt.
		 *
		 */
		define: function(connection, collection, definition, cb) {
			// Add in logic here to create a collection (e.g. CREATE TABLE logic)


			var conn = shared.connections[connection];
			var attributes = shared.collections[collection]._attributes;
			var prefix = conn.prefix.abr;
			var triples = "";


			/*
			 * Define Classes
			 */

			triples += "\n" + prefix + collection + " a " + "owl:Class . \n";

			/*
			 * Define SubClasses
			 */

			if (shared.collections[collection].parent) {
				for (parentClass in shared.collections[collection].parent) {
					triples += prefix + collection + " rdfs:subClassOf " + prefix + shared.collections[collection].parent[parentClass] + " . \n";
				}
			}

			/*
			 Define Properties
			 */
			for (attr in attributes) {




				// Everything else than id
				if (attr !== "id") {
					var type = attributes[attr].type;
					var range;
					var additionals = [];

					/*
					 Converts the SailsJS Type into an RDF-Valid Type
					 */
					var replace = {
						"datetime": "dateTime",
						"alphanumericdashed": "string",
						"alphanumeric": "string"
					};

					// Datatype Properties (String, Integer, Date, ...)
					if (!attributes[attr].model && !attributes[attr].collection) {
						property = "owl:DatatypeProperty";
						range = "xsd:" + (replace[type] || type);
					}

					// Object Properties (e.g. entry.author or user.entry)
					else {
						property = "owl:ObjectProperty";

						if (attributes[attr].collection) {
							additionals.push("owl:inverseOf " + prefix + attributes[attr].collection + "." + attributes[attr].via)
							range = prefix + attributes[attr].collection
						} else {
							range = prefix + attributes[attr].model
						}
					}

					triples += "\n" + prefix + collection + '.' + attr + ' a ' + property + ";\n";


					if (range) {
						// Globales Properties Object befüllen
						shared.properties[conn.prefix.abr + collection + '.' + attr] = {
							domain: prefix + collection,
							range: range,
							unique: attributes[attr].unique,
							multilang: attributes[attr].multilang
						}
						triples += "rdfs:domain " + prefix + collection + " ;\n";
						triples += "rdfs:range " + range;
					}


					var i = 0;
					var end = ";";

					if (additionals.length > 0) {
						triples += " ;";
						for (additional in additionals) {
							if (i == additionals.length - 1) end = "";
							triples += "\n" + additionals[additional] + end;
						}
					}

					triples += " .\n"
				} else {
					//log(attributes[attr].type)
				}
			}

			//        triples += "\n}\n}";

			//Save Schema to another Graph
			//var original_database = conn.database;
			//conn.database = conn.database + ".schema"

			// Start Query
			helper._insert(conn, triples, { graph: conn.definition, define: true }, function(err, res) {
				cb(null, true)
			})
		},

		/**
		 *
		 * REQUIRED method if integrating with a schemaful
		 * (SQL-ish) database.
		 *
		 */
		drop: function(connection, collection, relations, cb) {

			var conn = shared.connections[connection];
			var coll = shared.collections[collection];


			var values = "";
			var where = "";

			//cb(null, null)

			//async.series({
			//	delete_instances: function(callback) {
			//		// Step 1: Remove Instances
			//		values = "?a ?b ?c";
			//		where = "?a a " + conn.prefix.abr + collection + " . ?a ?b ?c .";
      //
			//		helper._delete(conn, values, { where: where, graph: conn.database }, callback);
			//	},
			//	delete_schema: function(callback) {
			//		// Step 2: Remove Properties & Class
			//		values = "?a ?b ?c" + " . " + conn.prefix.abr + collection + " a owl:Class .";
			//		where = "?a rdfs:domain " + conn.prefix.abr + collection + " . ?a ?b ?c ."
      //
			//		helper._delete(conn, values, { where: where, graph: conn.definition }, callback);
			//	}
			//}, function(err) {
      //
			//	// Finish
			//	cb(null, null)
			//})

			//TODO DB richtig clearen

			//var txId = null;
			//conn.connection.onlineDB({ database: conn.database, strategy: "NO_WAIT" }, function () {
			//	conn.connection.begin({ database: conn.database }, function (body, response) {
      //
			//		// Our new awesome transaction id
			//		txId = body;
			//		conn.connection.clearDB({ database: conn.database, "txId": txId }, function (dataC, responseC) {
      //
			//			conn.connection.commit({ database: conn.database, "txId": txId }, function (dataCom, responseCom) {

							cb(null, null);
				//		});
        //
        //
				//	});
				//});
			//});




			//var query = "DELETE { ?a ?b ?c } WHERE { ?a ?b ?c }"
			//
			//      		helper._query(conn, query, cb);
			// Add in logic here to delete a collection (e.g. DROP TABLE logic)
		},

		/**
		 *
		 * REQUIRED method if users expect to call Model.find(), Model.findOne(),
		 * or related.
		 *
		 * You should implement this method to respond with an array of instances.
		 * Waterline core will take care of supporting all the other different
		 * find methods/usages.
		 *
		 * Example
		 *
		 * Image.find();
		 *
		 */
		find: function(connection, collection, options, cb) {
			log("find!")
			log(options)

			var conn = shared.connections[connection];
			//			var coll = collections[collection];

			var query, select, where;


			// If we have a "groupBy" but not at least one aggregate function, discard!
			if (options.groupBy && !(options.sum || options.average	|| options.max || options.min)) {
				return cb(new Error("Nothing to calculate man!"));

			}

			query = '';

			select = helper._select(connection, collection, options);
			where = helper._where(connection, collection, options);

			query += select += where;

			// Hole das angeforderte Objekt
			helper._query(conn, query, options, function(err, data) {
				var results = helper.json_to_model(connection, collection, data, options);



				if (err) { return cb(err) }

				console.log(results)
				console.log("da haben wir ja was schönes")


				return cb(null, results);


				// TODO Kann hier entfernt werden, da select in den helper funktionen abgefragt wird
				/*
				 *   Wichtig:
				 *   Bevor wir nun das Objekt zurückgeben, müssen wir noch den Deep Select ausführen.
				 *   Das heißt, die holen jetzt noch alle weiteren Attribute, die sich in den Beziehungen der Objekte befinden.
				 *
				 *   1. Iteriere die options.select rekursiv
				 *   2. Gehe die einzelnen foreign relations durch und führe jeweils eine Suche für die models durch
				 *   3. Merge die Ergebnisse mit dem Haupt Objekt
				 *
				 */

				// Gehe alle Ergebnisse durch und hole die gewünschten Selects
				//var deep_select = function(branch, deep_collection) {
                //
				//	deep_collection = helper.ensure_prefix(deep_collection, conn.prefix.abr);
                //
				//	asyncEachObject(branch, function(value, key, callback) {
				//		if (key == "*") {
				//		} else {
				//			//              console.log(value)
				//			//              console.log(key)
				//			// Prüfe, ob die Property gültig ist
				//			if (shared.properties[deep_collection + "." + key]) {
				//				// if nested_object == true
				//				//    Müssen wir deeper gehen! -> deep_select(value, new_deep_collection)
				//				// else
				//				//    Können wir das gesuchte Model abfragen
				//				//                console.log(properties[deep_collection + "." + key])
				//			} else {
				//				//                console.log("Property ungültig!")
				//				//                console.log(deep_collection + "." + key)
				//			}
                //
				//		}
                //
				//		callback()
                //
				//	}, function(err) {
                //
				//		if (err) {
                //
				//		} else {
				//			//              console.log("Deep Select Finished!")
				//			//              console.log(results)
				//			return cb(null, results)
				//		}
				//	});
				//}
                //
                //
				//deep_select(options.select, collection);



			})


		},

		/**
		 * [join description]
		 * @param  {[type]} conn     [description]
		 * @param  {[type]} coll     [description]
		 * @param  {[type]} criteria [description]
		 * @param  {[type]} cb      [description]
		 * @return {[type]}          [description]
		 */
		join: function (connection, collection, criteria, cb) {

			var conn = shared.connections[connection];

			var parentIdentity = collection;

			// Populate associated records for each parent result
			// (or do them all at once as an optimization, if possible)
			_runJoins({

				instructions: criteria,
				parentCollection: parentIdentity,

				/**
				 * Find some records directly (using only this adapter)
				 * from the specified collection.
				 *
				 * @param  {String}   collectionIdentity
				 * @param  {Object}   criteria
				 * @param  {Function} cb
				 */
				$find: function (collectionIdentity, options, cb) {
					log("$find".blue)
					console.log("what?", collectionIdentity)


					var conn = shared.connections[connection];
					//			var coll = collections[collection];

					var query, select, where;


					// If we have a "groupBy" but not at least one aggregate function, discard!
					if (options.groupBy && !(options.sum || options.average	|| options.max || options.min)) {
						return cb(new Error("Nothing to calculate man!"));
					}

					query = '';
					select = helper._select(connection, collectionIdentity, options);
					where = helper._where(connection, collectionIdentity, options);
					query += select += where;


					// Hole das angeforderte Objekt
					helper._query(conn, query, options, function(err, data) {
						var results = helper.json_to_model(connection, collectionIdentity, data, options);

						if (err) { return cb(err) }
						return cb(null, results);
					})

					//return db.select(collectionIdentity, criteria, cb);
				},

				/**
				 * Look up the name of the primary key field
				 * for the collection with the specified identity.
				 *
				 * @param  {String}   collectionIdentity
				 * @return {String}
				 */
				$getPK: function (collectionIdentity) {
					if (!collectionIdentity) return;

					return helper.getPrimaryKey(collectionIdentity);
				}
			}, cb);

		},

		/*
		 *
		 * @description creates an entity and returns it via values
		 * @return values
		 *
		 *
		 */
		create: function(connection, collection, values, options, cb) {

			console.log("### create ###")


			if ('function' == typeof options) {
				cb = options;
			}

			var conn = shared.connections[connection];


			options.create = true;

			// Check if id is already given
			var id;
			if (!values.id) {
				//console.log("Generate ID".green);
				id = "m." + shortid.generate();
			}

			// if yes, take it as id
			// TODO: Geht noch ned ganz wenn man autocreatePK aus hat.
			else {
				console.log(values.id)

				id = values.id;
			}


			values.id = id;

			//        var triples = "@prefix " + conn.prefix.abr + " <" + conn.prefix.val + "> . \n";

			helper.model_to_turtle(connection, collection, values, options, function (triples) {
				helper._insert(conn, triples, function() {
					cb(null, values)
				})
			});

		},

		/*
		 *
		 * @description: uses the _delete and _insert function
		 *               looks for the values which should be changed,
		 *               first deletes it and then inserts the new values.
		 * @params options: contains the conditions (usually the id)
		 * @params values: the values which to change
		 */
		// TODO Check, warum values.id NAN ist
		update: function(connection, collection, options, values, cb) {
			var conn = shared.connections[connection];
			//			var coll = shared.collections[collection];


			// Fix ID=NaN
			if (isNaN(values.id))
				delete values.id;


			log("### Update ###".yellow);
			log(options)
			log(values)


			console.log(shared.collections[collection]._attributes)

			var obj;

			var new_values = [];

			var query = "";
			query += helper._select(connection, collection, options);
			query += helper._where(connection, collection, options);

			options.update = true;


			async.series({
				delete_triples: function(callback) {
					// Objekt suchen, das gelöscht werden soll
					helper._query(conn, query, function(err, result) {


						// Object contains all models that have to be updated
						obj = helper.json_to_model(connection, collection, result, options);

						// Old values which should be deleted
						var old_values = [];


						// Iterate through values and get old values from "obj" (which should be deleted)
							obj.forEach(function(v, i) {
								var id = v.id;

								old_values[i] = { id: id };
								new_values[i] = { id: id };


								for (value in values) {
									old_values[i][value] = v[value];
									new_values[i][value] = values[value];
								}
							});


						helper.model_to_turtle(connection, collection, old_values, options, function (triples_to_delete) {
							// Now delete the triples
							helper._delete(conn, triples_to_delete, callback)
						});

					})
				},
				insert_triples: function(callback) {

					// Get the triples we want to insert
					helper.model_to_turtle(connection, collection, new_values, options, function (triples_to_insert) {
						// And insert
						helper._insert(conn, triples_to_insert, callback)
					});

				}
			}, function(err) {
				// Get the new values
				helper._query(conn, query, function(err, result) {
					res = helper.json_to_model(connection, collection, result, options)
					cb(null, res)
				})
			})

		},

		destroy: function(connection, collection, options, values, cb) {


			// Debug
			console.log("### Destroy Start ###".red)
			console.log(collection);
			console.log(options);


			if ('function' == typeof values) {
				cb = values;
			}

			// No Limit
			//options.limit = 1000;


			var conn = shared.connections[connection];

			// First find
			this.find(connection, collection, options, function(err, res) {
log("result beforeee")

				// Then destroy
				helper.model_to_turtle(connection, collection, res, { delete: true }, function (triples) {
					helper._delete(conn, triples, function(err) {
						log("resulttt")
						log(res)
						// Give back model after destroying
						return cb(null, res);
					});
				});


			});


		},

		/*
		 *   Test Definition einer Custom Function!
		 *   Ziemlich coole Sache.
		 */
		test: function(connection, collection, options, cb) {
			return cb(null, "okidoki");
		},

		createSubClass: function(connection, collection, options, lol, cb) {


			return cb(null, "okidoki")
		}

		/*

		 // Custom methods defined here will be available on all models
		 // which are hooked up to this adapter:
		 //
		 // e.g.:
		 //
		 foo: function (collectionName, options, cb) {
		 return cb(null,"ok");
		 },
		 bar: function (collectionName, options, cb) {
		 if (!options.jello) return cb("Failure!");
		 else return cb();
		 destroy: function (connection, collection, options, values, cb) {
		 return cb();
		 }

		 // So if you have three models:
		 // Tiger, Sparrow, and User
		 // 2 of which (Tiger and Sparrow) implement this custom adapter,
		 // then you'll be able to access:
		 //
		 // Tiger.foo(...)
		 // Tiger.bar(...)
		 // Sparrow.foo(...)
		 // Sparrow.bar(...)


		 // Example success usage:
		 //
		 // (notice how the first argument goes away:)
		 Tiger.foo({}, function (err, result) {
		 if (err) return console.error(err);
		 else console.log(result);

		 // outputs: ok
		 });

		 // Example error usage:
		 //
		 // (notice how the first argument goes away:)
		 Sparrow.bar({test: 'yes'}, function (err, result){
		 if (err) console.error(err);
		 else console.log(result);

		 // outputs: Failure!
		 })




		 */


	};


	// Expose adapter definition
	return adapter;

})();

//}))
