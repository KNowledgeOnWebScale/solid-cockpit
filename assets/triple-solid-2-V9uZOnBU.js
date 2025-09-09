const t=`# Datasources: http://localhost:3000/test/random/nbn-chist-era-annex-1-chemicals-custom-predicate.ttl
PREFIX thd: <urn:triple-hybrid-demo:>
SELECT DISTINCT ?CAS WHERE {

  # Solid pod data
  ?SOLIDPOD thd:predicate ?CAS .

}`;export{t as default};
