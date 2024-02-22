import { type Session, getDefaultSession, fetch as fetchWithSession } from '@inrupt/solid-client-authn-browser'


const appName = 'Solid Pod Browser'
const webId = "WebID"
const defaultWebId = ''
const session: Session = getDefaultSession()

async function login(provider: string, appName: string): Promise<void> {
    if (!session.info.isLoggedIn) {
        await session.login({
            oidcIssuer: provider,
            clientName: appName,
            redirectUrl: window.location.href
        })
    } else {
        throw new Error('Already logged in')
    }
}

async function logout(): Promise<void> {
    if (session.info.isLoggedIn) {
        await session.logout()
        location.reload()
    }
}

async function handleRedirectAfterPageLoad(): Promise<void> {
    await session.handleIncomingRedirect({
        url: window.location.href,
        restorePreviousSession: true
    })
}

await handleRedirectAfterPageLoad()

export { login, logout, session, defaultWebId, appName, webId, fetchWithSession }