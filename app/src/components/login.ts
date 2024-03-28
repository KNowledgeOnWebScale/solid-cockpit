import {
  Session,
  handleIncomingRedirect,
  getDefaultSession,
} from "@inrupt/solid-client-authn-browser";

const session: Session = getDefaultSession()
handleIncomingRedirect();

async function startLogin(purl: string): Promise<string> {
  // Start the Login Process if not already logged in.
  let status = '';
  if (!session.info.isLoggedIn) {
    try {
      await session.login({
        oidcIssuer: purl, //https does not work for some reason?? figure this out later
        redirectUrl: new URL("/", window.location.href).toString(),
        clientName: "TRIPLE app"
      });
    } catch (error) {
      console.error('Error:', error);
      status = 'error';
    }
  }
  return status;
}

function isLoggedin(): boolean {
  return session.info.isLoggedIn
}

function currentWebId(): string {
  return session.info.webId
}

async function handleRedirectAfterPageLoad(): Promise<void> {
  await session.handleIncomingRedirect({
    url: window.location.href,
    restorePreviousSession: true
  })
}


export { startLogin, isLoggedin, handleRedirectAfterPageLoad, currentWebId, session }
