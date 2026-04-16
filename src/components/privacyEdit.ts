import {
  getSolidDatasetWithAcl,
  getResourceAcl,
  hasAccessibleAcl,
  setAgentResourceAccess,
  setAgentDefaultAccess,
  setPublicResourceAccess,
  setPublicDefaultAccess,
  WithResourceInfo,
  AclDataset,
  SolidDataset,
  saveSolidDatasetAt,
  WithServerResourceInfo,
  WithAcl,
  createSolidDataset,
  getSourceUrl,
  UrlString,
  getSolidDataset,
  getThingAll,
  Thing,
  getThing,
  setThing,
  createContainerAt,
  addUrl,
  getDatetime,
  getUrl,
  getIri,
  getIriAll,
  createThing,
  addIri,
  setDatetime,
  addDatetime,
} from "@inrupt/solid-client";
import { fetch } from "@inrupt/solid-client-authn-browser";
import { WorkingData, fetchData, fetchPermissionsData } from "./getData";
import { generateSeededHash } from "./queryPod";

export type Permissions = {
  read: boolean;
  append: boolean;
  write: boolean;
  control: boolean;
};

export const { freeze } = Object;

const DCT_CREATOR = "http://purl.org/dc/terms/creator";
const DCT_CREATED = "http://purl.org/dc/terms/created";
const LDP_INBOX = "http://www.w3.org/ns/ldp#inbox";
const ACL_ACCESS_TO = "http://www.w3.org/ns/auth/acl#accessTo";
const AS_TARGET = "https://www.w3.org/ns/activitystreams#target";
const AS_OFFER = "https://www.w3.org/ns/activitystreams#Offer";
const RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

const ACL_MODE_BY_PERMISSION: Record<keyof Permissions, string> = {
  read: "http://www.w3.org/ns/auth/acl#Read",
  append: "http://www.w3.org/ns/auth/acl#Append",
  write: "http://www.w3.org/ns/auth/acl#Write",
  control: "http://www.w3.org/ns/auth/acl#Control",
};

const SHARED_WITH_ME_PREFIXES = `
  PREFIX dct: <http://purl.org/dc/terms/>
  PREFIX acl: <http://www.w3.org/ns/auth/acl#>
  PREFIX as: <https://www.w3.org/ns/activitystreams#>
`;

const SHARED_WITH_OTHERS_PREFIXES = `
  ${SHARED_WITH_ME_PREFIXES}
  PREFIX ldp: <http://www.w3.org/ns/ldp#>
`;

/**
 * Optional controls for LDPN write helpers.
 * - `forceUndo`: write an `as:Undo` entry instead of an `as:Offer`.
 * - `modeIris`: explicit list of ACL mode IRIs to persist (used for revocation subsets).
 */
export interface NotificationWriteOptions {
  forceUndo?: boolean;
  modeIris?: string[];
}

/**
 * Extract the document URL of a WebID by removing any fragment identifier.
 *
 * LDPN fallback logic uses this document URL when no explicit ldp:inbox link exists.
 */
export function getWebIdDocumentUrl(webId: string): string {
  const parsed = new URL(webId);
  parsed.hash = "";
  return parsed.href;
}

/**
 * Returns enabled ACL mode IRIs for a permission object.
 */
export function getEnabledAccessModeIris(
  accessModes: Permissions
): string[] {
  return (Object.keys(ACL_MODE_BY_PERMISSION) as (keyof Permissions)[])
    .filter((key) => Boolean(accessModes[key]))
    .map((key) => ACL_MODE_BY_PERMISSION[key]);
}

/**
 * Returns ACL mode IRIs that were revoked (present before, absent after).
 */
export function getRevokedAccessModeIris(
  previousAccess: Permissions,
  nextAccess: Permissions
): string[] {
  return (Object.keys(ACL_MODE_BY_PERMISSION) as (keyof Permissions)[])
    .filter((key) => Boolean(previousAccess[key]) && !Boolean(nextAccess[key]))
    .map((key) => ACL_MODE_BY_PERMISSION[key]);
}

/**
 * Builds a compact, opaque, unique fragment ID for append-only LDPN entries.
 */
export function createOpaqueNotificationId(seed: string): string {
  return generateSeededHash(
    `${seed}|${getCurrentRdfDateTime()}|${Math.random().toString(36).slice(2)}`
  );
}

function toSparqlIriList(iris: string[]): string {
  return iris.map((iri) => `<${iri}>`).join(", ");
}

/**
 * Normalizes how mode IRIs are chosen for Offer vs Undo notifications.
 *
 * When writing Undo entries and no explicit modes are supplied, all ACL modes
 * are included as a conservative fallback so the revocation entry remains informative.
 */
function resolveNotificationModeIris(
  accessModes: Permissions,
  options?: NotificationWriteOptions
): { isRevocation: boolean; modeIris: string[] } {
  const providedModes = options?.modeIris ?? getEnabledAccessModeIris(accessModes);
  const isRevocation = options?.forceUndo ?? providedModes.length === 0;
  const modeIris =
    isRevocation && providedModes.length === 0
      ? Object.values(ACL_MODE_BY_PERMISSION)
      : providedModes;
  return { isRevocation, modeIris };
}

/**
 * Executes a SPARQL UPDATE PATCH against an LDPN log and validates the response.
 */
async function patchLdpnLog(
  logUrl: string,
  prefixes: string,
  newTriples: string
): Promise<void> {
  const response = await fetch(logUrl, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/sparql-update",
    },
    body: `
      ${prefixes}
      INSERT DATA {
        ${newTriples}
      }
    `,
  });

  if (!response.ok) {
    throw new Error(`PATCH failed with status ${response.status}`);
  }
}

/**
 * Builds the INSERT DATA payload body for sharedWithMe notifications.
 */
export function buildSharedWithMeInsertData(params: {
  entryId: string;
  sharedBy: string;
  resourceUrl: string;
  modeIris: string[];
  revokedOfferIri?: string;
}): string {
  const { entryId, sharedBy, resourceUrl, modeIris, revokedOfferIri } = params;
  const now = getCurrentRdfDateTime();
  const typedDate = `"${now}"^^<http://www.w3.org/2001/XMLSchema#dateTime>`;
  const typeTriple = revokedOfferIri
    ? `a as:Undo ;\n      as:object <${revokedOfferIri}> ;`
    : `a as:Offer ;`;

  return `
    <#${entryId}>
      ${typeTriple}
      dct:creator <${sharedBy}> ;
      dct:created ${typedDate} ;
      acl:accessTo <${resourceUrl}> ;
      acl:mode ${toSparqlIriList(modeIris)} .
  `;
}

/**
 * Builds the INSERT DATA payload body for sharedWithOthers notifications.
 */
export function buildSharedWithOthersInsertData(params: {
  entryId: string;
  resourceUrl: string;
  sharedWith: string;
  modeIris: string[];
  revokedOfferIri?: string;
}): string {
  const { entryId, resourceUrl, sharedWith, modeIris, revokedOfferIri } = params;
  const now = getCurrentRdfDateTime();
  const typedDate = `"${now}"^^<http://www.w3.org/2001/XMLSchema#dateTime>`;

  if (revokedOfferIri) {
    return `
    <#${entryId}>
      a as:Undo ;
      as:object <${revokedOfferIri}> ;
      as:target <${sharedWith}> ;
      dct:created ${typedDate} ;
      acl:accessTo <${resourceUrl}> ;
      acl:mode ${toSparqlIriList(modeIris)} .
    `;
  }

  const sharedThing = resourceUrl.endsWith("/") ? "Container" : "Resource";
  return `
    <${resourceUrl}> 
      a ldp:${sharedThing} ;
      as:Offer <#${entryId}> .
    
    <#${entryId}> 
      a as:Offer ;
      as:target <${sharedWith}> ;
      acl:accessTo <${resourceUrl}> ;
      acl:mode ${toSparqlIriList(modeIris)} ;
      dct:created ${typedDate} .
  `;
}

/**
 * Returns the current timestamp in RDF format,
 * e.g. "2025-04-09T15:23:45Z"^^<http://www.w3.org/2001/XMLSchema#dateTime>
 */
export function getCurrentRdfDateTime(): string {
  return new Date().toISOString();
}

/**
 * Function that checks if an input string is a valid URL
 *
 * @param urlString A string to be checked if it is a valid URL
 * @param webid the user's webId as a string
 *
 * @returns boolean of FALSE if the string IS a valid URL // TRUE if the string is NOT a vaild URL
 */
export function checkUrl(urlString: string, webid: string): boolean {
  try {
    new URL(urlString);
    if (urlString !== webid) {
      return false;
    } else {
      return true;
    }
  } catch (err) {
    return true;
  }
}

/**
 * A working version of the saveAclFor method described in [https://github.com/inrupt/solid-client-js/blob/5d35c2e3bd40b3045b5b04ca9c7aa43865a39837/src/acl/acl.ts#L487].
 *
 * @param resource A Solid dataset (obtained from a container URL) with an ACL file
 * @param resourceAcl the updated .acl information that is to be saved to the pod
 *
 * @returns the AclDataset saved for the designated container or resource
 */
async function saveAclFor(
  resource: SolidDataset & WithServerResourceInfo & WithAcl,
  resourceAcl: SolidDataset
): Promise<AclDataset & WithResourceInfo> {
  if (!hasAccessibleAcl(resource)) {
    throw new Error(
      `Could not determine the location of the ACL for the Resource at [${getSourceUrl(
        resource
      )}];`
    );
  }
  const savedDataset = await saveSolidDatasetAt(
    resource.internal_resourceInfo.aclUrl,
    resourceAcl,
    { fetch: fetch }
  );

  const savedAclDataset: AclDataset & typeof savedDataset = {
    ...savedDataset,
    internal_accessTo: getSourceUrl(resource),
  };

  return savedAclDataset;
}

/**
 * Changes the access control settings of a specified resource using setAgentResourceAccess() from Inrupt.
 *
 * @param url A URL for a Solid Dataset with an ACL file
 * @param user The user WebID that will obtain new access rights
 * @param accessLevel a 4 item list that contains boolean values for [read, append, write, control] access rights
 *
 * @returns an AclDataset that represents the updated ACL
 */
export async function changeAclAgent(
  url: UrlString,
  user: string,
  accessLevel: Permissions
): Promise<void> {
  // Changes access for the resource
  const solidDataWAcl = await getSolidDatasetWithAcl(url, { fetch: fetch });
  const resourceAcl = getResourceAcl(solidDataWAcl);
  let updatedAcl = setAgentResourceAccess(resourceAcl, user, accessLevel);
  // If the URL is a container, set the default access for child resources
  if (url.endsWith("/")) {
    updatedAcl = setAgentDefaultAccess(updatedAcl, user, accessLevel);
  }
  await saveAclFor(solidDataWAcl, updatedAcl);

  // Changes access for all resources within the container (if the url is a container)
  if (url.endsWith("/")) {
    const asolidDataWAcl = await getSolidDatasetWithAcl(url, { fetch: fetch });
    const aresourceAcl = getResourceAcl(asolidDataWAcl);
    const aupdatedAcl = setPublicDefaultAccess(aresourceAcl, accessLevel);
    await saveAclFor(asolidDataWAcl, aupdatedAcl);
  }
}

// Set Agent ACL access

/**
 * Changes the access control settings of a specified resource using setPublicResourceAccess() from Inrupt.
 *
 * @param url A URL for a Solid Dataset with an ACL file
 * @param accessLevel a 4 item list that contains boolean values for [read, append, write, control] access rights
 *
 * @returns an AclDataset that represents the updated ACL
 */
export async function changeAclPublic(
  url: UrlString,
  accessLevel: Permissions
): Promise<void> {
  // Changes access for the resource
  const solidDataWAcl = await getSolidDatasetWithAcl(url, { fetch: fetch });
  const resourceAcl = getResourceAcl(solidDataWAcl);
  let updatedAcl = setPublicResourceAccess(resourceAcl, accessLevel);
  // If the URL is a container, set the default access for child resources
  if (url.endsWith("/")) {
    updatedAcl = setPublicDefaultAccess(updatedAcl, accessLevel);
  }
  await saveAclFor(solidDataWAcl, updatedAcl);

  // Changes access for all resources within the container (if the url is a container)
  if (url.endsWith("/")) {
    const asolidDataWAcl = await getSolidDatasetWithAcl(url, { fetch: fetch });
    const aresourceAcl = getResourceAcl(asolidDataWAcl);
    const aupdatedAcl = setPublicDefaultAccess(aresourceAcl, accessLevel);
    await saveAclFor(asolidDataWAcl, aupdatedAcl);
  }
}

/**
 * Function adopted from [https://github.com/inrupt/solid-client-js/blob/5d35c2e3bd40b3045b5b04ca9c7aa43865a39837/src/acl/acl.ts#L303]
 * Creates an empty .acl resource
 *
 * @param targetResource a resource or container that does not have a defined .acl yet
 * @returns a blank .acl resource for the designated container or resource
 */
export function createNewAcl(targetResource: WorkingData): AclDataset {
  // initialize empty ACL
  const emptyResourceAcl: AclDataset = freeze({
    ...createSolidDataset(),
    internal_accessTo: getSourceUrl(targetResource),
    internal_resourceInfo: {
      sourceIri: targetResource.internal_resourceInfo.aclUrl,
      isRawData: false,
      linkedResources: {},
    },
  });

  return emptyResourceAcl;
}

/**
 * Adds an .acl resource to a container or resource with default permissions (i.e. only owner has "Control" access)
 *
 * @param resourceURL The URL of the conatainer that needs an .acl configured
 * @param userWebId The webID that base level access rights should be granted to
 *
 * @returns an .acl resource that has been generated for the designated resource or container
 */
export async function generateAcl(
  resourceURL: string,
  userWebId: string
): Promise<AclDataset & WithResourceInfo> {
  // create blank ACL at current location
  const location = await fetchData(resourceURL);
  const newAcl = createNewAcl(location);

  // add base user permissions
  const userAccess: Permissions = {
    read: true,
    append: true,
    write: true,
    control: true,
  };

  // add that root ACL info to empty acl
  const updatedNewAcl = setAgentResourceAccess(newAcl, userWebId, userAccess);
  const defUpdatedNewAcl = setAgentDefaultAccess(
    updatedNewAcl,
    userWebId,
    userAccess
  );

  const savedDataset = await saveSolidDatasetAt(
    location.internal_resourceInfo.aclUrl,
    defUpdatedNewAcl,
    { fetch: fetch }
  );

  const savedAclDataset: AclDataset & typeof savedDataset = {
    ...savedDataset,
    internal_accessTo: getSourceUrl(location),
  };

  return savedAclDataset;
}

/**
 * Creates an Inbox container and .acl with public append permissions
 *
 * @param podRootUrl The URL of the root pod
 * @param userWebId The webID that base level access rights should be granted to
 */
export async function createInboxWithACL(
  podRootUrl: string,
  userWebId: string
): Promise<void> {
  const inboxUrl = `${podRootUrl}inbox/`;

  try {
    // Try to retrieve the dataset (container) and save updated dataset
    await getSolidDataset(inboxUrl, { fetch });
    return;
  } catch (error) {
    console.log(`No ${inboxUrl} container found, creating a new one...`);
  }

  // If there is no inbox/ currently in the User Pod
  try {
    // Define the inbox URL
    const inboxUrl = `${podRootUrl}inbox/`;

    // Create the inbox container
    await createContainerAt(inboxUrl, { fetch });
    console.log(`Inbox container created at: ${inboxUrl}`);

    // Ensure inbox ACL exists before creating LDPN files.
    const existingInboxAcl = await fetchPermissionsData(inboxUrl);
    if (existingInboxAcl == null) {
      console.warn("Initializing an ACL for your inbox/ container...");
      await generateAcl(inboxUrl, userWebId);
    }

    // Add the Inbox container location to the User's WebId
    let profileDataset = await getSolidDataset(userWebId, { fetch });
    let webIdThing = getThing(profileDataset, userWebId);
    if (!webIdThing) {
      throw new Error("WebID Thing not found in profile document.");
    }
    // Add the ldp:inbox triple
    webIdThing = addUrl(webIdThing, "http://www.w3.org/ns/ldp#inbox", inboxUrl);
    // Update the dataset with the modified Thing
    profileDataset = setThing(profileDataset, webIdThing);
    // Save the updated dataset back to the Solid Pod
    await saveSolidDatasetAt(userWebId, profileDataset, { fetch });
    console.log(`Added ldp:inbox (${inboxUrl}) to ${userWebId}`);

    // // Apply the public append ACL rule
    const access = {
      read: false,
      append: true,
      write: false,
      control: false,
    };
    // Grant append access to anyone (foaf:Agent)
    // const solidDataWAcl = await getSolidDatasetWithAcl(inboxUrl, {
    //   fetch: fetch,
    // });
    // const updatedAclDataset = setPublicResourceAccess(aclDataset, access);
    // const aupdatedAcl = setPublicDefaultAccess(updatedAclDataset, access);
    // // // Save the updated ACL dataset
    // await saveAclFor(solidDataWAcl, aupdatedAcl);

    // Initialize the sharedWithMe.ttl file
    const mefileName = "sharedWithMe.ttl";
    const medataset = createSolidDataset();
    const newDataset = await recordLastAccessTime(
      medataset,
      inboxUrl + mefileName
    );
    await saveSolidDatasetAt(inboxUrl + mefileName, newDataset, { fetch });
    console.log(`CREATED sharedWithMe.ttl`);

    // Grant append access (for sharedWithMe.ttl) to anyone (foaf:Agent)
    const swmeAcl = await getSolidDatasetWithAcl(inboxUrl + mefileName, {
      fetch: fetch,
    });
    const swmeaclDataset = await generateAcl(inboxUrl + mefileName, userWebId);
    const updatedswmeAcl = setPublicResourceAccess(swmeaclDataset, access);
    await saveAclFor(swmeAcl, updatedswmeAcl);
    console.log(`ADDED .acl for sharedWithMe.ttl`);

    // Initialize the sharedWithOthers.ttl file
    const othersfileName = "sharedWithOthers.ttl";
    const otherdataset = createSolidDataset();
    await saveSolidDatasetAt(inboxUrl + othersfileName, otherdataset, {
      fetch,
    });
    console.log(`CREATED sharedWithOthers.ttl`);

    console.log(`ACL set: Public append access granted to ${inboxUrl}`);
  } catch (error) {
    console.error("Error creating inbox container or setting ACL:", error);
  }
}

/**
 * Discover a user's inbox URL using ldp:inbox; fallback follows LDPN:
 * {webid-document}/inbox/ when no explicit inbox link is present.
 */
export async function resolveInboxUrlFromWebId(webId: string): Promise<string> {
  const webIdDocument = getWebIdDocumentUrl(webId);
  const fallbackInbox = `${webIdDocument.replace(/\/$/, "")}/inbox/`;

  try {
    const profileDataset = await getSolidDataset(webIdDocument, { fetch });
    const possibleThings: Thing[] = [];

    const exactWebIdThing = getThing(profileDataset, webId);
    if (exactWebIdThing) {
      possibleThings.push(exactWebIdThing);
    }

    const inferredThing = getThing(profileDataset, `${webIdDocument}#me`);
    if (inferredThing) {
      possibleThings.push(inferredThing);
    }

    possibleThings.push(...getThingAll(profileDataset));

    for (const thing of possibleThings) {
      const inboxUrl = getUrl(thing, LDP_INBOX);
      if (inboxUrl) {
        return inboxUrl.endsWith("/") ? inboxUrl : `${inboxUrl}/`;
      }
    }
  } catch (error) {
    console.warn(`Could not resolve ldp:inbox for ${webId}, using fallback.`);
  }

  return fallbackInbox;
}

/**
 * Find the most recent as:Offer entry in a log that matches the provided constraints.
 */
async function findLatestOfferIri(
  logUrl: string,
  filters: {
    creator?: string;
    target?: string;
    accessTo: string;
  }
): Promise<string | null> {
  try {
    const dataset = await getSolidDataset(logUrl, { fetch });
    const things = getThingAll(dataset);
    const candidates = things.filter((thing) => {
      const typeIri = getIri(thing, RDF_TYPE);
      if (typeIri !== AS_OFFER) {
        return false;
      }
      if (getUrl(thing, ACL_ACCESS_TO) !== filters.accessTo) {
        return false;
      }
      if (filters.creator && getUrl(thing, DCT_CREATOR) !== filters.creator) {
        return false;
      }
      if (filters.target && getUrl(thing, AS_TARGET) !== filters.target) {
        return false;
      }
      return true;
    });

    candidates.sort((a, b) => {
      const aDate = getDatetime(a, DCT_CREATED)?.getTime() ?? 0;
      const bDate = getDatetime(b, DCT_CREATED)?.getTime() ?? 0;
      return bDate - aDate;
    });

    return candidates[0]?.url ?? null;
  } catch (error) {
    console.warn(`Could not inspect prior offers in ${logUrl}.`);
    return null;
  }
}

/**
 * Appends a permissions notification to another user's `sharedWithMe.ttl` log.
 *
 * This helper writes LDPN-compliant `as:Offer` entries by default, and can write
 * `as:Undo` entries when revocations are requested through `options`.
 *
 * @param otherUserWebId - The user's Solid Pod URL (with which data is being shared)
 * @param sharedBy - The WebID of the person who shared the resource (you)
 * @param resourceURL - The URL of the resource that was shared
 * @param accessModes - Access booleans used to derive ACL mode IRIs
 * @param options - Optional controls for revocation and explicit mode IRIs
 */
export async function updateSharedWithMe(
  otherUserWebId: string,
  sharedBy: string,
  resourceURL: string,
  accessModes: Permissions,
  options?: NotificationWriteOptions
): Promise<boolean> {
  const inboxUrl = await resolveInboxUrlFromWebId(otherUserWebId);
  const otherSharedWithMeUrl = `${inboxUrl}sharedWithMe.ttl`;
  const { isRevocation, modeIris } = resolveNotificationModeIris(
    accessModes,
    options
  );
  const entryId = createOpaqueNotificationId(
    `${resourceURL}|${sharedBy}|sharedWithMe`
  );

  let revokedOfferIri: string | undefined = undefined;
  if (isRevocation) {
    const previousOffer = await findLatestOfferIri(otherSharedWithMeUrl, {
      creator: sharedBy,
      accessTo: resourceURL,
    });
    if (!previousOffer) {
      console.warn(
        `No prior as:Offer entry found in ${otherSharedWithMeUrl}; cannot append spec-compliant as:Undo entry.`
      );
      return false;
    }
    revokedOfferIri = previousOffer;
  }

  // Attempt to update sharedWithMe.ttl with a PATCH SPARQL update
  try {
    const newTriples = buildSharedWithMeInsertData({
      entryId,
      sharedBy,
      resourceUrl: resourceURL,
      modeIris,
      revokedOfferIri,
    });
    await patchLdpnLog(
      otherSharedWithMeUrl,
      SHARED_WITH_ME_PREFIXES,
      newTriples
    );
    console.log(`Added triples to ${otherSharedWithMeUrl} ...`);
    return true;
  } catch (error) {
    console.log(`Could not add triples to ${otherSharedWithMeUrl} ...`);
    return false;
  }
}

/**
 * Appends a permissions notification to the current user's `sharedWithOthers.ttl`.
 *
 * This helper writes LDPN-compliant `as:Offer` entries by default, and can write
 * `as:Undo` entries when revocations are requested through `options`.
 *
 * @param podUrl - The user's Solid Pod URL where sharedWithOthers.ttl is stored
 * @param resourceUrl - The URL of the resource/container that is being shared
 * @param sharedWith - The WebID of the person who you are sharing the resource with
 * @param accessModes - Access booleans used to derive ACL mode IRIs
 * @param options - Optional controls for revocation and explicit mode IRIs
 *
 * @returns true when the log write succeeds, otherwise false.
 */
export async function updateSharedWithOthers(
  podUrl: string,
  resourceUrl: string,
  sharedWith: string,
  accessModes: Permissions,
  options?: NotificationWriteOptions
): Promise<boolean> {
  const inboxUrl = `${podUrl}inbox/`;
  const fileName = "sharedWithOthers.ttl";
  const { isRevocation, modeIris } = resolveNotificationModeIris(
    accessModes,
    options
  );
  const entryId = createOpaqueNotificationId(
    `${resourceUrl}|${sharedWith}|sharedWithOthers`
  );

  let revokedOfferIri: string | undefined = undefined;
  if (isRevocation) {
    const previousOffer = await findLatestOfferIri(
      `${inboxUrl}${fileName}`,
      {
        target: sharedWith,
        accessTo: resourceUrl,
      }
    );
    if (!previousOffer) {
      console.warn(
        `No prior as:Offer entry found in ${inboxUrl}${fileName}; cannot append spec-compliant as:Undo entry.`
      );
      return false;
    }
    revokedOfferIri = previousOffer;
  }

  // Attempt to update sharedWithOthers.ttl with a PATCH SPARQL update
  try {
    const newTriples = buildSharedWithOthersInsertData({
      entryId,
      resourceUrl,
      sharedWith,
      modeIris,
      revokedOfferIri,
    });
    await patchLdpnLog(
      `${inboxUrl}${fileName}`,
      SHARED_WITH_OTHERS_PREFIXES,
      newTriples
    );
    console.log(`Added triples to ${fileName} ...`);
    return true;
  } catch (error) {
    console.log(`Could not add triples to ${fileName} ...`);
    return false;
  }
}

export interface sharedSomething {
  resourceHash: string;
  usersSharedWith: userHash[];
  owner: string;
  whatKind: string;
}

export interface userHash {
  sharedWith: string;
  accessModes: string[];
  resourceUrl: string;
  created: string;
}

export interface indexedUserHash {
  resourceHash: string;
  sharedHashes: userHash;
}

/**
 * Retrieves all shared data entries from a sharedWithOthers.ttl file.
 *
 * It loads the dataset, iterates over all Things, and for each Thing it displays additional data:
 * it extracts:
 *
 *  The Resource/Container (URL)
 *    WHO the resource is shared with <WebId>;
 *    WHAT the URL is <LDP:Resource> ;
 *    ACCESS CONTROLS offered <access_mode>, <access_mode> ;
 *    TIME "date + time".
 *
 * @param rootPodUrl - The URL of the current user's Solid Pod URL
 * @param currentUserWebId - The WebID of the current user
 * @returns An array of sharedItems objects.
 */
export async function getSharedWithOthers(
  rootPodUrl: string,
  currentUserWebId: string
): Promise<sharedSomething[]> {
  // Load the dataset from the TTL file.
  const sharedWithOthersUrl = `${rootPodUrl}inbox/sharedWithOthers.ttl`;
  const dataset: SolidDataset = await getSolidDataset(sharedWithOthersUrl, {
    fetch,
  });
  const things: Thing[] = getThingAll(dataset);
  const sharedItems: sharedSomething[] = [];

  let i = 0;
  things.forEach((thing) => {
    // Extract the hash from the Thing’s URL fragment.
    i += 1;
    const thingUrl = thing.url;
    const resourceHash = thingUrl.includes("#")
      ? `${thingUrl.split("#")[1]}`
      : thingUrl;
    // Only consider resource/container subject nodes.
    if (
      getIriAll(thing, AS_OFFER).length > 0 &&
      (resourceHash.includes("/") || thingUrl.includes("/"))
    ) {
      const whatKind =
        getIri(thing, RDF_TYPE) ||
        "N/A";
      const sharedHashes = getIriAll(
        thing,
        AS_OFFER
      ) || ["N/A"];
      const usersSharedWith = thingsUsersSharedWithParse(
        sharedHashes,
        things,
        i
      );
      const owner = currentUserWebId;

      sharedItems.push({
        resourceHash,
        usersSharedWith,
        owner,
        whatKind,
      });
    }
  });
  return sharedItems;
}

/**
 * Iterates through sharedWithOthers.ttl and extracts the users a resource is shared with.
 * @param userHashes The list of userHashes to get data from.
 * @param things Array of RDF Things from the dataset.
 * @param index The current index of the Things list (for dynamic parsing).
 * @returns An array of Objects that represent the things shared.
 */
function thingsUsersSharedWithParse(
  userHashes: string[],
  things: Thing[],
  index: number
): userHash[] {
  const usersSharedWith: userHash[] = [];

  // Iterate through the Things array and extract the users a resource is shared with
  let userIndex = 0;
  while (index < things.length && userIndex < userHashes.length) {
    // See is the current thing is a user hash
    if (userHashes[userIndex] === things[index].url) {
      const created =
        getDatetime(
          things[index],
          "http://purl.org/dc/terms/created"
        )?.toISOString() || "N/A";
      const sharedWith =
        getUrl(things[index], "https://www.w3.org/ns/activitystreams#target") ||
        "N/A";
      const resourceUrl =
        getUrl(things[index], "http://www.w3.org/ns/auth/acl#accessTo") ||
        "N/A";
      const access = getIriAll(
        things[index],
        "http://www.w3.org/ns/auth/acl#mode"
      ) || ["N/A"];

      usersSharedWith.push({
        sharedWith,
        resourceUrl,
        accessModes: access,
        created,
      });
      userIndex += 1;
      index += 1;
    } else {
      index += 1;
    }
  }
  return usersSharedWith;
}

export interface SharedWithMeData {
  lastAccessed: string;
  sharedItems: sharedSomething[];
}
/**
 * Retrieves all shared data entries from a sharedWithMe.ttl file.
 *
 * It loads the dataset, iterates over all Things, and for each Thing it displays additional data:
 * it extracts:
 *
 *  The Resource/Container (URL)
 *    WHO shared the resource <WebId>;
 *    WHAT the URL is <LDP:Resource> ;
 *    ACCESS CONTROLS offered <access_mode>, <access_mode> ;
 *    TIME "date + time".
 *
 * @param rootPodUrl - The URL of the current user's Solid Pod URL
 * @returns An array of sharedItems objects.
 */
export async function getSharedWithMe(
  rootPodUrl: string
): Promise<SharedWithMeData> {
  // Load the dataset from the TTL file.
  const sharedWithMeUrl = `${rootPodUrl}inbox/sharedWithMe.ttl`;
  const dataset = await getSolidDataset(sharedWithMeUrl, { fetch });

  const things: Thing[] = getThingAll(dataset);
  const sharedItems: sharedSomething[] = [];
  let lastAccessed: string = "N/A";

  things.forEach((thing) => {
    try {
      const resourceHash = thing.url.includes("#")
        ? thing.url.split("#")[1]
        : "";

      // Get the last accessed time
      if (resourceHash === "lastAccess") {
        lastAccessed =
          getDatetime(
            thing,
            "http://purl.org/dc/terms/modified"
          )?.toISOString() || "N/A";
      } else {
        // Get all other info
        const creator =
          getUrl(thing, "http://purl.org/dc/terms/creator") || "N/A";
        const created =
          getDatetime(
            thing,
            "http://purl.org/dc/terms/created"
          )?.toISOString() || "N/A";
        const accessTo =
          getUrl(thing, "http://www.w3.org/ns/auth/acl#accessTo") || "N/A";
        const accessModes = getIriAll(
          thing,
          "http://www.w3.org/ns/auth/acl#mode"
        ) || ["N/A"];
        const whatKind =
          getIri(thing, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") ||
          "N/A";

        const usersSharedWith: userHash[] = [
          {
            sharedWith: creator,
            resourceUrl: accessTo,
            accessModes: accessModes,
            created: created,
          },
        ];

        sharedItems.push({
          resourceHash,
          usersSharedWith,
          owner: creator,
          whatKind,
        });
      }
    } catch (error) {
      console.log("Error processing thing:", error);
    }
  });

  return {
    lastAccessed,
    sharedItems,
  };
}

/**
 * Records the last access time of the sharedWithMe.ttl file.
 * If the triple exists, updates the object to the current date and time.
 * If the triple does not exist, creates the triple.
 *
 * @param dataset The SolidDataset representing the sharedWithMe.ttl file.
 * @param fileUrl The URL of the sharedWithMe.ttl file.
 */
export function recordLastAccessTime(
  dataset: SolidDataset,
  fileUrl: string
): SolidDataset {
  const accessTimePredicate = "http://purl.org/dc/terms/modified";
  const thingSubj = `${fileUrl}#lastAccess`;
  try {
    // change date accessed to current dateTime
    let thing = getThing(dataset, thingSubj);
    thing = setDatetime(thing, accessTimePredicate, new Date());
    return setThing(dataset, thing);
  } catch (error) {
    // Triple does not exist, create the triple
    try {
      let thing = addDatetime(
        createThing({ name: "lastAccess" }),
        "http://purl.org/dc/terms/modified",
        new Date()
      );
      return setThing(dataset, thing);
    } catch (error) {
      console.error("Error creating lastAccess thing:", error);
    }
  }
}

export async function saveNewAccessTime(podUrl: string): Promise<boolean> {
  try {
    const workingDataset = await getSolidDataset(
      `${podUrl}inbox/sharedWithMe.ttl`,
      { fetch }
    );
    const newAccess = recordLastAccessTime(
      workingDataset,
      `${podUrl}inbox/sharedWithMe.ttl`
    );
    console.log(newAccess);
    await saveSolidDatasetAt(`${podUrl}inbox/sharedWithMe.ttl`, newAccess, {
      fetch,
    });
    return true;
  } catch (error) {
    console.error("Error saving new access time:", error);
    return false;
  }
}
