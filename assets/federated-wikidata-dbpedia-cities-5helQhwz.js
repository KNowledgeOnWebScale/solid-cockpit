const t=`# Datasources: https://query.wikidata.org/sparql, https://dbpedia.org/sparql
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX bd: <http://www.bigdata.com/rdf#>
PREFIX dbo: <http://dbpedia.org/ontology/>

SELECT ?city ?cityLabel ?countryLabel ?dbpediaAbstract
WHERE {
  SERVICE <https://query.wikidata.org/sparql> {
    ?city wdt:P31/wdt:P279* wd:Q515 ;  # city
          wdt:P17 ?country .
    SERVICE wikibase:label {
      bd:serviceParam wikibase:language "en" .
      ?city rdfs:label ?cityLabel .
      ?country rdfs:label ?countryLabel .
    }
  }

  SERVICE <https://dbpedia.org/sparql> {
    ?dbpediaCity rdfs:label ?cityLabel ;
                 dbo:abstract ?dbpediaAbstract .
    FILTER(lang(?cityLabel) = "en")
    FILTER(lang(?dbpediaAbstract) = "en")
  }
}
LIMIT 20
`;export{t as default};
