const e=`# Datasources: https://triple.ilabt.imec.be/test/chist-era-annex-1-chemicals.ttl
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rh: <http://rdf.rhea-db.org/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX sio: <http://semanticscience.org/resource/>
PREFIX vocab: <http://rdf.ncbi.nlm.nih.gov/pubchem/vocabulary#>
PREFIX sachem: <http://bioinfo.uochb.cas.cz/rdf/v1.0/sachem#>
PREFIX thd: <urn:triple-hybrid-demo:>

SELECT DISTINCT ?SIMILAR_COMPOUND ?rhea ?equation WHERE {
# SELECT ?CAS ?COMPOUND ?SIMILAR_COMPOUND ?SCORE WHERE {

  # Solid pod data
  ?SOLIDPOD thd:predicate ?CAS .

  # IDSM
  SERVICE <https://idsm.elixir-czech.cz/sparql/endpoint/idsm> {
    ?SYNONYM a sio:CHEMINF_000446 . # CAS registry number
    ?SYNONYM sio:SIO_000300 ?CAS .
    ?SYNONYM sio:SIO_000011 ?COMPOUND .

    ?COMPOUND a vocab:Compound .

    ?ATTRIBUTE a sio:SIO_011120 . # molecular structure file
    ?ATTRIBUTE sio:SIO_000011 ?COMPOUND .
    ?ATTRIBUTE sio:SIO_000300 ?MOLFILE .

    SERVICE <https://idsm.elixir-czech.cz/sparql/endpoint/chebi> {
      [
        sachem:compound ?SIMILAR_COMPOUND ;
          sachem:score ?SCORE
      ] sachem:similaritySearch [
        sachem:query ?MOLFILE ;
        sachem:cutoff "0.7"^^xsd:double ;
        sachem:similarityRadius "3"^^xsd:integer ;
        sachem:aromaticityMode sachem:aromaticityDetectIfMissing ;
        sachem:tautomerMode sachem:inchiTautomers
      ] .
    }
  }

  # Rhea
  SERVICE <https://sparql.rhea-db.org/sparql> {
    ?rhea rdfs:subClassOf rh:Reaction .
    ?rhea rh:equation ?equation .
    ?rhea rh:side/rh:contains/rh:compound ?rhea_compound .
    #
    # the ChEBI can be used either as a small molecule, the reactive part of a macromolecule or as a polymer.
    #
    ?compound (rh:chebi|(rh:reactivePart/rh:chebi)|(rh:underlyingChebi/rh:chebi)) ?SIMILAR_COMPOUND . # ?chebi comes from IDSM higher
  }

} LIMIT 1`;export{e as default};
