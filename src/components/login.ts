import {
  Session,
  handleIncomingRedirect,
  getDefaultSession,
} from "@inrupt/solid-client-authn-browser";

/*
Calls handleRedirectAfterPageLoad() on page reload.
Crucially, stores credentials in session and fetch objects.
*/
const session: Session = getDefaultSession()
handleRedirectAfterPageLoad()

/**
 * Begins the User login process via the login() method from @inrupt/solid-client by following a Pod Provider URL link.
 * 
 * @param purl The URL of user's Pod Provider.
 * @returns A Promise that resolves to a string, if there is an error, it is returned in this string.
*/
async function startLogin(purl: string): Promise<string> {
  // Start the Login Process if not already logged in.
  let status = '';
  if (!session.info.isLoggedIn) {
    try {
      await session.login({
        oidcIssuer: purl, //https does not work for some reason?? figure this out later
        redirectUrl: new URL("/TRIPLE_App/", window.location.href).toString(),
        clientName: "TRIPLE app"
      });
    } catch (error) {
      console.error('Error:', error);
      status = 'error';
    }
  }
  return status;
}

/**
 * Checks if the current User is logged-in to a Solid Pod.
 * 
 * @returns a boolean obtained from the session object that signifies login status
*/
function isLoggedin(): boolean {
  return session.info.isLoggedIn
}

/**
 * Obtains the current user's webID from the session object.
 * 
 * @returns a user's webID URL as a string.
*/
function currentWebId(): string {
  return session.info.webId as string;
}

/**
 * Redirects the user back to the TRIPLE App homepage
*/
function redirectToHomepage(): void {
  window.location.href = new URL("/TRIPLE_App/", window.location.href).toString()
}

/**
 * Checks if the current User is logged-in to a Solid Pod after page-reload.
*/
async function handleRedirectAfterPageLoad(): Promise<void> {
  try {
    handleIncomingRedirect({restorePreviousSession: true})
  } catch (error) {
    console.error('Error:', error);
  }
}


export { startLogin, isLoggedin, handleRedirectAfterPageLoad, currentWebId, redirectToHomepage, session }
