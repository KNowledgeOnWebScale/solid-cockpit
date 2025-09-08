const t=`# Datasources: http://localhost:3000/test/Uploads/nbn-chist-era-annex-1-chemicals-alt.ttl
PREFIX thd: <urn:triple-hybrid-demo:>
SELECT DISTINCT ?CAS WHERE {

  # Solid pod data
  ?SOLIDPOD thd:predicate ?CAS .

}`;export{t as default};
