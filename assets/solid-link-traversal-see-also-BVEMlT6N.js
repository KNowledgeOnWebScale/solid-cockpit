const e=`# Datasources:https://triple.ilabt.imec.be/test/profile/card
# QueryMode: solid-link-traversal
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?linkedDocument
WHERE {
  <http://localhost:3000/test/profile/card#me> rdfs:seeAlso ?linkedDocument .
}
LIMIT 10
`;export{e as default};
