module.exports = {

// You'll want to maintain a reference to each connection
// that gets registered with this adapter.
  connections: {},
  collections: {},
  //var classes = {};

// Default properties for the validator.
  properties: {
    'rdf:type': {
      domain: 'rdfs:Resource',
      range: 'rdfs:Class'
    },
    'a': {
      domain: 'rdfs:Resource',
      range: 'rdfs:Class'
    },
    'rdfs:label': {
      domain: 'rdfs:Class',
      range: 'rdfs:Literal'
    }
  }

};


