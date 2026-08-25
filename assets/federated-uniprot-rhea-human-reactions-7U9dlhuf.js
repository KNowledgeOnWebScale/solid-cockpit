var e=`# Datasources: https://sparql.uniprot.org/sparql https://sparql.rhea-db.org/sparql/
PREFIX up: <http://purl.uniprot.org/core/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?protein ?reaction ?reactionLabel
WHERE {
  ?protein a up:Protein ;
            up:organism <http://purl.uniprot.org/taxonomy/9606> ;
            up:catalyzedReaction ?reaction .
  ?reaction rdfs:label ?reactionLabel .
  FILTER(lang(?reactionLabel) = "en")
}
LIMIT 30
`;export{e as default};