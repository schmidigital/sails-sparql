Stardog = require('stardog');

conn = new Stardog.Connection();
conn.setEndpoint(process.argv[3]);
conn.setCredentials(process.argv[4], process.argv[5]);

var options = {
    "database" : process.argv[2],
    "options" : { "index.type": "disk" },
    "files": []
};


conn.createDB(options, function (data, response) {
    console.log(response.statusCode)
});