/**
 * Run integration tests
 *
 * Uses the `waterline-adapter-tests` module to
 * run mocha tests against the appropriate version
 * of Waterline.  Only the interfaces explicitly
 * declared in this adapter's `package.json` file
 * are tested. (e.g. `queryable`, `semantic`, etc.)
 */

(function () {

/**
 * Module dependencies
 */

var util = require('util');
var mocha = require('mocha');
var log = new (require('captains-log'))();
var TestRunner = require('waterline-adapter-tests');
var Adapter = require('../../');
var async = require('async');



// Grab targeted interfaces from this adapter's `package.json` file:
var package = {};
var interfaces = [];
try {
    package = require('../../package.json');
    interfaces = package['waterlineAdapter'].interfaces;
}
catch (e) {
    throw new Error(
    '\n'+
    'Could not read supported interfaces from `waterlineAdapter.interfaces`'+'\n' +
    'in this adapter\'s `package.json` file ::' + '\n' +
    util.inspect(e)
    );
}



 //Deaktiviert, da sonst stardog.createDB nicht mehr funktioniert!
log.info('Testing `' + package.name + '`, a Sails/Waterline adapter.');
log.info('Running `waterline-adapter-tests` against ' + interfaces.length + ' interfaces...');
log.info('( ' + interfaces.join(', ') + ' )');
console.log();
log('Latest draft of Waterline adapter interface spec:');
log('http://links.sailsjs.org/docs/plugins/adapters/interfaces');
console.log();


//console.log('Testing `' + package.name + '`, a Sails/Waterline adapter.');
//console.log('Running `waterline-adapter-tests` against ' + interfaces.length + ' interfaces...');
//console.log('( ' + interfaces.join(', ') + ' )');
//console.log();
//console.log('Latest draft of Waterline adapter interface spec:');
//console.log('http://links.sailsjs.org/docs/plugins/adapters/interfaces');
//console.log();



var Stardog = require('stardog')

//
//async.series([
//      function(callback){
//          console.log(1)
//
//          conn = new Stardog.Connection();
//          conn.setEndpoint("http://localhost:5820/");
//          conn.setCredentials("admin", "admin");
//
//
//          var options = {
//              "database" : "lol",
//              "options" : { "index.type" : "disk" },
//              "files": []
//          };
//
//          conn.createDB(options, function (data, response) {
//
//              console.log(123)
//              console.log(data)
//
//
//              callback(null, 'one');
//
//          });
//
//
//          // do some stuff ...
//      },
//      function(callback){
//          console.log(2)
//
//          // do some more stuff ...
//          callback(null, 'two');
//      }
//  ],
//// optional callback
//  function(err, results){
//      console.log(3)
//
//      // results is now equal to ['one', 'two']
//  });
//



/**
 * Integration Test Runner
 *
 * Uses the `waterline-adapter-tests` module to
 * run mocha tests against the specified interfaces
 * of the currently-implemented Waterline adapter API.
 */
new TestRunner({

    // Load the adapter module.
    adapter: Adapter,

    // Default adapter config to use.
    config: {
				database: 'test',
				definition: 'test_schema',
				adapter: 'sails-sparql',
				endpoint: 'http://localhost:5820/',
				port: 5820,
				schema: false,
				prefix: {
					abr: "mb:",
					val: "http://rdf.mindbabble.com/ns/"
				}
    },

    mocha: {
        timeout: 60000
    },

    // The set of adapter interfaces to test against.
    // (grabbed these from this adapter's package.json file above)
    interfaces: interfaces

    // Most databases implement 'semantic' and 'queryable'.
    //
    // As of Sails/Waterline v0.10, the 'associations' interface
    // is also available.  If you don't implement 'associations',
    // it will be polyfilled for you by Waterline core.  The core
    // implementation will always be used for cross-adapter / cross-connection
    // joins.
    //
    // In future versions of Sails/Waterline, 'queryable' may be also
    // be polyfilled by core.
    //
    // These polyfilled implementations can usually be further optimized at the
    // adapter level, since most databases provide optimizations for internal
    // operations.
    //
    // Full interface reference:
    // https://github.com/balderdashy/sails-docs/blob/master/adapter-specification.md
});
})();