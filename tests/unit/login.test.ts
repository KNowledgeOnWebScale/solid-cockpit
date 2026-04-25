import assert from "node:assert/strict";
import test, { afterEach, beforeEach } from "node:test";
import {
  session,
  startLogin,
  logOut,
  isLoggedin,
  currentWebId,
  getPodURLs,
  redirectToHomepage,
  redirectToLogin,
} from "../../src/services/solid/login.ts";

function createSessionStorageMock() {
  const store = new Map<string, string>();
  return {
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key) : null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

const originalWindow = (globalThis as any).window;
const originalSessionStorage = (globalThis as any).sessionStorage;
const originalLogin = session.login;
const originalLogout = session.logout;
const originalSessionInfo = { ...session.info } as any;
const originalConsoleError = console.error;

beforeEach(() => {
  (globalThis as any).window = {
    location: { href: "https://example.org/solid-cockpit/login" },
  };
  (globalThis as any).sessionStorage = createSessionStorageMock();

  session.login = originalLogin;
  session.logout = originalLogout;
  session.info.isLoggedIn = false;
  (session.info as any).webId = originalSessionInfo.webId;
});

afterEach(() => {
  (globalThis as any).window = originalWindow;
  (globalThis as any).sessionStorage = originalSessionStorage;

  session.login = originalLogin;
  session.logout = originalLogout;
  session.info.isLoggedIn = originalSessionInfo.isLoggedIn;
  (session.info as any).webId = originalSessionInfo.webId;
  console.error = originalConsoleError;
});

test("startLogin stores redirect and calls session.login when logged out", async () => {
  let callCount = 0;
  session.login = (async (options: any) => {
    callCount += 1;
    assert.equal(options.oidcIssuer, "https://issuer.example");
    assert.equal(options.redirectUrl, "https://example.org/solid-cockpit/login");
    assert.equal(options.clientName, "Solid Cockpit");
  }) as any;

  const status = await startLogin("https://issuer.example");
  assert.equal(status, "");
  assert.equal(callCount, 1);
  assert.equal(
    (globalThis as any).sessionStorage.getItem("postLoginRedirect"),
    "https://example.org/solid-cockpit/login"
  );
});

test("startLogin is a no-op when already logged in", async () => {
  session.info.isLoggedIn = true;
  let callCount = 0;
  session.login = (async () => {
    callCount += 1;
  }) as any;

  const status = await startLogin("https://issuer.example");
  assert.equal(status, "");
  assert.equal(callCount, 0);
});

test("startLogin returns error status when session.login fails", async () => {
  session.login = (async () => {
    throw new Error("login failed");
  }) as any;
  console.error = () => {};

  const status = await startLogin("https://issuer.example");
  assert.equal(status, "error");
});

test("logOut returns updated login state when logout succeeds", async () => {
  session.info.isLoggedIn = true;
  session.logout = (async () => {
    session.info.isLoggedIn = false;
  }) as any;

  assert.equal(await logOut(), false);
});

test("logOut returns current login state when logout fails", async () => {
  session.info.isLoggedIn = true;
  session.logout = (async () => {
    throw new Error("logout failed");
  }) as any;
  console.error = () => {};

  assert.equal(await logOut(), true);
});

test("logOut returns false when already logged out", async () => {
  session.info.isLoggedIn = false;
  assert.equal(await logOut(), false);
});

test("isLoggedin and currentWebId reflect session info", () => {
  session.info.isLoggedIn = true;
  (session.info as any).webId = "https://pod.example/profile/card#me";

  assert.equal(isLoggedin(), true);
  assert.equal(currentWebId(), "https://pod.example/profile/card#me");
});

test("getPodURLs returns null when pod URL lookup fails", async () => {
  (session.info as any).webId = undefined;
  assert.equal(await getPodURLs(), null);
});

test("redirect helpers set location href under /solid-cockpit", () => {
  (globalThis as any).window.location.href = "https://example.org/current/page";

  redirectToHomepage();
  assert.equal((globalThis as any).window.location.href, "https://example.org/solid-cockpit/");

  (globalThis as any).window.location.href = "https://example.org/current/page";
  redirectToLogin();
  assert.equal((globalThis as any).window.location.href, "https://example.org/solid-cockpit/login");
});
