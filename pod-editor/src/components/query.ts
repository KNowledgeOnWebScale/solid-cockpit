import { session } from './session'
import { findOne } from './engine'
import { type UserWebID } from './WebID'

const prefixes: string = `
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    PREFIX solid: <http://www.w3.org/ns/solid/terms#>
    PREFIX pim: <http://www.w3.org/ns/pim/space#>
    PREFIX ex: <http://example.org/>
    PREFIX acl: <http://www.w3.org/ns/auth/acl#>
    PREFIX todo: <http://example.org/todolist/>
`

let pendingWebId: Promise<UserWebID> | undefined

/** Retrieval of specific entries */

async function getWebIdPromise(webId?: string): Promise<UserWebID> {
    const webIdValue = webId ?? session.info.webId

    if (webIdValue == null) {
        throw new Error('WebID IRI is required to query it')
    }

    const query: string = `
    ${prefixes}

    SELECT ?id ?oidcIssuer ?storage ?name ?pathTemplate WHERE {
        ?id solid:oidcIssuer ?oidcIssuer .
        OPTIONAL { ?id pim:storage ?storage } .
        OPTIONAL { ?id foaf:name|foaf:givenName ?name } .
        OPTIONAL { ?id todo:pathTemplate ?pathTemplate } .
    }
    `
    const value: UserWebID | undefined = await findOne<UserWebID>(query, webIdValue)
    if (value === undefined) {
        throw new Error('Query discovered no WebID')
    }

    return value
}

async function getWebId(webId?: string): Promise<UserWebID> {
    if (pendingWebId === undefined) {
        pendingWebId = getWebIdPromise(webId)
    }
    return await pendingWebId
}

export { getWebId }