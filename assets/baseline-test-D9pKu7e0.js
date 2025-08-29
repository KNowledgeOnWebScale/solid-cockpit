const s=`# Datasources: https://sparql.rhea-db.org/sparql/
SELECT DISTINCT ?p WHERE {
  ?s ?p ?o .
} LIMIT 10`;export{s as default};
