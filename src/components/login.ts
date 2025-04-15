import {
  Session,
  handleIncomingRedirect,
  getDefaultSession,
} from "@inrupt/solid-client-authn-browser";
import {
  getPodUrlAll
} from "@inrupt/solid-client";

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
      sessionStorage.setItem("postLoginRedirect", window.location.href);

      await session.login({
        oidcIssuer: purl, 
        redirectUrl: window.location.href,
        clientName: "Solid Cockpit"
      });
    } catch (error) {
      console.error('Error:', error);
      status = 'error';
    }
  }
  return status;
}

/**
 * Logs the user out via the logout() method from @inrupt/solid-client by clearing the session.
 * 
 * @returns A Promise that resolves to a boolean. (false === 'logged out' / true === 'logged in')
*/
async function logOut(): Promise<boolean> {
  if (session.info.isLoggedIn) {
    try {
      await session.logout({ logoutType: 'app' });
      return session.info.isLoggedIn
    } catch (error) {
      console.error('Error:', error);
    }
  } else {
    return session.info.isLoggedIn
  }
}

/**
 * Checks if the current User is logged-in to a Solid Pod.
 * 
 * @returns a boolean that signifies login status (false === 'logged out' / true === 'logged in')
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
 * Fetches a logged-in user's Pod URLs using a webID.
 *
 * @param webid The webID URL of the current user.
 * @returns A Promise that resolves to a string[] of user Pod URLs, if available, or `undefined` if no pods are found.
 */
async function getPodURLs(): Promise<string[] | null> {
  try {
    return await getPodUrlAll(session.info.webId, { fetch: fetch });
  } catch (error) {
    return null;
  }
}

/**
 * Redirects the user back to the TRIPLE App homepage
*/
function redirectToHomepage(): void {
  window.location.href = new URL("/solid-cockpit/", window.location.href).toString()
}

/**
 * Redirects the user to the TRIPLE App login page
*/
function redirectToLogin(): void {
  window.location.href = new URL("/solid-cockpit/login", window.location.href).toString()
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




export { startLogin, isLoggedin, handleRedirectAfterPageLoad, currentWebId, getPodURLs, redirectToHomepage, redirectToLogin, logOut, session }
