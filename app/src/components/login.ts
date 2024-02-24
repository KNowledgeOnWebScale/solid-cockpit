import {
  login,
  handleIncomingRedirect,
  getDefaultSession,
  fetch
} from "@inrupt/solid-client-authn-browser";

async function startLogin() {
  // Start the Login Process if not already logged in.
  if (!getDefaultSession().info.isLoggedIn) {
    await login({
      oidcIssuer: "http://localhost:3000", //https does not work for some reason?? figure this out later
      redirectUrl: new URL("/", window.location.href).toString(),
      clientName: "TRIPLE app"
    });
  }
}

export { startLogin }
