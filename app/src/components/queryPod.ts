import { Session, fetch } from "@inrupt/solid-client-authn-browser";
import { QueryEngine } from '@comunica/query-sparql';
import { Bindings } from '@comunica/types';

const myEngine = new QueryEngine();

/**
 * Fetches a logged-in user's Pod URLs using a webID.
 * 
 * @param webid The webID URL of the current user.
 * @returns A Promise that resolves to a string[] of user Pod URLs, if available, or `undefined` if no pods are found.
*/

async function executeQuery(source: string, session: Session): Promise<Bindings[]> {
  
  const bindingsStream = await myEngine.queryBindings(`
  SELECT ?s ?p ?o WHERE {
    ?s ?p ?o .
  } LIMIT 100`, {
  sources: [source],
  '@comunica/actor-http-inrupt-solid-client-authn:session': session
  });

  return await bindingsStream.toArray()
}

export { executeQuery };