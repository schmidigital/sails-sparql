curl -X POST -F "update=INSERT DATA {
  <http://localhost:8890/dataspace/test3/wiki/testWiki>         <http://atomowl.org/ontologies/atomrdf#contains>   <http://localhost:8890/dataspace/test3/wiki/testWiki/MyTest>  . 
  <http://localhost:8890/dataspace/test3/wiki/testWiki/MyTest>  <http://rdfs.org/sioc/ns#has_container>            <http://localhost:8890/dataspace/test3/wiki/testWiki>         . 
  <http://localhost:8890/dataspace/test3/wiki/testWiki>         <http://atomowl.org/ontologies/atomrdf#entry>      <http://localhost:8890/dataspace/test3/wiki/testWiki/MyTest>  . 
  <http://localhost:8890/dataspace/test3/wiki/testWiki>         <http://rdfs.org/sioc/ns#container_of>             <http://localhost:8890/dataspace/test3/wiki/testWiki/MyTest>  . 
  <http://localhost:8890/dataspace/test3/wiki/testWiki/MyTest>  <http://rdfs.org/sioc/ns#topic>                    <http://localhost:8890/dataspace/test3/wiki/testWiki>         . 
  <http://localhost:8890/dataspace/test3/wiki/testWiki/MyTest>  <http://atomowl.org/ontologies/atomrdf#source>     <http://localhost:8890/dataspace/test3/wiki/testWiki>         . 
  <http://localhost:8890/dataspace/test3/wiki/testWiki/MyTest>  <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>  <http://rdfs.org/sioc/types#Comment>                          . 
  <http://localhost:8890/dataspace/test3/wiki/testWiki/MyTest>  <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>  <http://atomowl.org/ontologies/atomrdf#Entry>                 . 
  <http://localhost:8890/dataspace/test3/wiki/testWiki/MyTest>  <http://www.w3.org/2000/01/rdf-schema#label>       'MyTest'                                                      . 
  <http://localhost:8890/dataspace/test3/wiki/testWiki/MyTest>  <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>  <http://atomowl.org/ontologies/atomrdf#Link>                  . 
  <http://localhost:8890/dataspace/test3/wiki/testWiki/MyTest>  <http://rdfs.org/sioc/ns#content>                  <test>                                                        .
    <http://localhost:8890/dataspace/test3/wiki/testWiki>         <http://atomowl.org/ontologies/atomrdf#contains>   <http://localhost:8890/dataspace/test3/wiki/testWiki/MyTest>  . 
  <http://localhost:8890/dataspace/test3/wiki/testWiki/MyTest>  <http://rdfs.org/sioc/ns#has_container>            <http://localhost:8890/dataspace/test3/wiki/testWiki>         . 
  <http://localhost:8890/dataspace/test3/wiki/testWiki>         <http://atomowl.org/ontologies/atomrdf#entry>      <http://localhost:8890/dataspace/test3/wiki/testWiki/MyTest>  . 
  <http://localhost:8890/dataspace/test3/wiki/testWiki>         <http://rdfs.org/sioc/ns#container_of>             <http://localhost:8890/dataspace/test3/wiki/testWiki/MyTest>  . 
  <http://localhost:8890/dataspace/test3/wiki/testWiki/MyTest>  <http://rdfs.org/sioc/ns#topic>                    <http://localhost:8890/dataspace/test3/wiki/testWiki>         . 
  <http://localhost:8890/dataspace/test3/wiki/testWiki/MyTest>  <http://atomowl.org/ontologies/atomrdf#source>     <http://localhost:8890/dataspace/test3/wiki/testWiki>         . 
  <http://localhost:8890/dataspace/test3/wiki/testWiki/MyTest>  <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>  <http://rdfs.org/sioc/types#Comment>                          . 
  <http://localhost:8890/dataspace/test3/wiki/testWiki/MyTest>  <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>  <http://atomowl.org/ontologies/atomrdf#Entry>                 . 
  <http://localhost:8890/dataspace/test3/wiki/testWiki/MyTest>  <http://www.w3.org/2000/01/rdf-schema#label>       'MyTest'                                                      . 
  <http://localhost:8890/dataspace/test3/wiki/testWiki/MyTest>  <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>  <http://atomowl.org/ontologies/atomrdf#Link>                  . 
  <http://localhost:8890/dataspace/test3/wiki/testWiki/MyTest>  <http://rdfs.org/sioc/ns#content>                  <test>                                                        .
}" -H "Content-Type: application/x-www-form-urlencoded" http://schmid.digital:8889/bigdata/sparql