import { QueryEngine } from '@comunica/query-sparql-link-traversal-solid'
import { ActorHttpInruptSolidClientAuthn } from '@comunica/actor-http-inrupt-solid-client-authn'
import type { Bindings, BindingsStream, QueryStringContext, IQueryEngine } from '@comunica/types'
import { session } from './session'

const queryEngine: IQueryEngine = new QueryEngine()

function context(url?: string): QueryStringContext {
    if (url == null) {
        throw new Error('Queries require a source URL')
    }
    const context: QueryStringContext = {
        sources: [url],
        baseIRI: url,
        lenient: true
    }
    if (session.info.isLoggedIn) {
        context.fetch = session.fetch
        context[ActorHttpInruptSolidClientAuthn.CONTEXT_KEY_SESSION.name] = session
    }
    return context
}

async function find<T>(query: string, url: string): Promise<T[]> {
    const queryContext = context(url)
    const bindingsStream: BindingsStream = await queryEngine.queryBindings(query, queryContext)
    const bindingsArray: Bindings[] = await bindingsStream.toArray()
    const output: T[] = bindingsArray.map((bindings: Bindings) => {
        const entry: T = {} as T
        for (const [key, value] of bindings) {
            entry[key.value] = value.value
        }
        return entry
    })
    return output
}

async function findOne<T>(query: string, url: string): Promise<T | undefined> {
    const queryForOne = query.includes('LIMIT 1') ? query : query.trimEnd() + ' LIMIT 1'
    const results: T[] = await find<T>(queryForOne, url)
    return results.at(0)
}

export { find, findOne }