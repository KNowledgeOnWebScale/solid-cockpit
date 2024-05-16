import { Session } from "@inrupt/solid-client-authn-browser";
import { QueryEngine } from '@comunica/query-sparql-link-traversal-solid';
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
  SELECT ?o WHERE {
    ?s <http://www.w3.org/ns/ldp#contains> ?o .
  }`, {
  sources: [source],
  '@comunica/actor-http-inrupt-solid-client-authn:session': session
  });

  return await bindingsStream.toArray()
}

export { executeQuery };