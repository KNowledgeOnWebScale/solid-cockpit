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
} from "@inrupt/solid-client";
import { fetch } from "@inrupt/solid-client-authn-browser";
import { WorkingData, fetchData, fetchPermissionsData } from "./getData";
import { generateHash, generateSeededHash } from "./queryPod";

export type Permissions = {
  read: boolean;
  append: boolean;
  write: boolean;
  control: boolean;
};

export const { freeze } = Object;

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
  const defUpdatedNewAcl = setAgentDefaultAccess(updatedNewAcl, userWebId, userAccess);

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

    // Fetch the dataset (resource ACL)
    let aclDataset = await fetchPermissionsData(inboxUrl);
    if (aclDataset == null) {
      console.warn("Initializing an ACL for your inbox/ container...");
      aclDataset = await generateAcl(inboxUrl, userWebId);
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

    // Grant append access to anyone (foaf:Agent)
    const solidDataWAcl = await getSolidDatasetWithAcl(inboxUrl, {
      fetch: fetch,
    });
    // // Apply the public append ACL rule
    const access = {
      read: false,
      append: true,
      write: false,
      control: false,
    };
    const updatedAclDataset = setPublicResourceAccess(aclDataset, access);
    const aupdatedAcl = setPublicDefaultAccess(updatedAclDataset, access);
    // // Save the updated ACL dataset
    await saveAclFor(solidDataWAcl, aupdatedAcl);

    // Initialize the sharedWithMe.ttl file
    const mefileName = "sharedWithMe.ttl";
    const medataset = createSolidDataset();
    await saveSolidDatasetAt(inboxUrl + mefileName, medataset, { fetch });
    console.log(`CREATED sharedWithMe.ttl`);

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
 * Attempts to PATCH shared data information (triples) to another user's sharedWithMe.ttl file.
 *
 * Each shared resource is represented as an entry with the form:
 *
 *    <#hash>
 *      a as:Offer ;
        dct:creator <WebId> ;
        dct:created "ISODateTime"^^<http://www.w3.org/2001/XMLSchema#dateTime> ;
        acl:accessTo <ResourceURL> ;
        acl:mode acl:Read, ... .
      
      <ResourceURL>
        a ldp:Resource/Container .
 *
 * @param otherUserWebId - The user's Solid Pod URL (with which data is being shared)
 * @param sharedBy - The WebID of the person who shared the resource (you)
 * @param resourceUrl - The URL of the resource that was shared (your thing)
 * @param accessModes - Array of access modes (e.g., ['Read', 'Write'])
 */
export async function updateSharedWithMe(
  otherUserWebId: string,
  sharedBy: string,
  resourceURL: string,
  accessModes: Permissions
): Promise<boolean> {
  const otherUserBasePod =
    otherUserWebId.split("/").slice(0, -2).join("/") + "/";
  const otherSharedWithMeUrl = `${otherUserBasePod}inbox/sharedWithMe.ttl`;
  const hash = generateSeededHash(resourceURL);

  // Construct access modes string
  let accessModesString = "";
  for (const [key, value] of Object.entries(accessModes)) {
    if (value) {
      accessModesString += `acl:${
        key.charAt(0).toUpperCase() + key.slice(1)
      }, `;
    }
  }
  // Remove the trailing comma and space
  accessModesString = accessModesString.slice(0, -2);

  // TODO: Add additional logic here for RDFSource / NonRDFSource / BasicContainer
  let sharedThing = "";
  if (resourceURL.endsWith("/")) {
    sharedThing = "Container";
  } else {
    sharedThing = "Resource";
  }

  // Attempt to update sharedWithMe.ttl with a PATCH SPARQL update
  try {
    const newTriples = `
    <#${hash}>
      a as:Offer ;
      dct:creator <${sharedBy}> ;
      dct:created "${getCurrentRdfDateTime()}"^^<http://www.w3.org/2001/XMLSchema#dateTime> ;
      acl:accessTo <${resourceURL}> ;
      acl:mode ${accessModesString} .
    `;
    await fetch(`${otherSharedWithMeUrl}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/sparql-update",
      },
      body: `
        PREFIX dct: <http://purl.org/dc/terms/>
        PREFIX acl: <http://www.w3.org/ns/auth/acl#>
        PREFIX as: <https://www.w3.org/ns/activitystreams#>
        PREFIX ldp: <http://www.w3.org/ns/ldp#>
        INSERT DATA {
          ${newTriples}
        }
      `,
    });
    console.log(`Added triples to ${otherSharedWithMeUrl} ...`);
    return true;
  } catch (error) {
    console.log(`Could not add triples to ${otherSharedWithMeUrl} ...`);
    return false;
  }
}

// TODO: Integrate this shring functionality in Query component

/**
 * Creates or updates a (.ttl) file that records resources/containers this user has shared with others.
 * user has shared with others in the pod root container.
 *
 * Each entry is recorded as an entry like:
 *
 *    <#resourceUrl>
 *      as:target <WebID> ;
 *      a ldp:container ;
 *      dct:created "ISODateTime"^^<http://www.w3.org/2001/XMLSchema#dateTime> ;
 *      acl:accessTo <ResourceURL> ;
 *      acl:mode acl:Read, ... .
 *
 * @param podUrl - The user's Solid Pod URL where sharedWithOthers.ttl is stored
 * @param resourceUrl - The URL of the resource/container that is being shared
 * @param sharedWith - The WebID of the person who you are sharing the resource with
 * @param accessModes - Array of access modes (e.g., ['Read', 'Write'])
 *
 * @return a string with a message representative of success or failure
 */
export async function updateSharedWithOthers(
  podUrl: string,
  resourceUrl: string,
  sharedWith: string,
  accessModes: Permissions
): Promise<boolean> {
  const sharedWithMeUrl = `${podUrl}inbox/`;
  const fileName = "sharedWithOthers.ttl";
  const hash = generateSeededHash(resourceUrl+sharedWith);

  // Construct access modes string
  let accessModesString = "";
  for (const [key, value] of Object.entries(accessModes)) {
    if (value) {
      accessModesString += `acl:${
        key.charAt(0).toUpperCase() + key.slice(1)
      }, `;
    }
  }
  // Remove the trailing comma and space
  accessModesString = accessModesString.slice(0, -2);

  // TODO: Add additional logic here for RDFSource / NonRDFSource / BasicContainer
  let sharedThing = "";
  if (resourceUrl.endsWith("/")) {
    sharedThing = "Container";
  } else {
    sharedThing = "Resource";
  }

  // Attempt to update sharedWithOthers.ttl with a PATCH SPARQL update
  try {
    const newTriples = `
    <#${resourceUrl}> 
      a ldp:${sharedThing} ;
      as:Offer <#${hash}> .
    
    <#${hash}> 
      as:target <${sharedWith}> ;
      acl:accessTo <${resourceUrl}> ;
      acl:mode ${accessModesString} ;
      dct:created "${getCurrentRdfDateTime()}"^^<http://www.w3.org/2001/XMLSchema#dateTime> .
    `;
    await fetch(`${sharedWithMeUrl}${fileName}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/sparql-update",
      },
      body: `
        PREFIX dct: <http://purl.org/dc/terms/>
        PREFIX acl: <http://www.w3.org/ns/auth/acl#>
        PREFIX as: <https://www.w3.org/ns/activitystreams#>
        PREFIX ldp: <http://www.w3.org/ns/ldp#>
        INSERT DATA {
          ${newTriples}
        }
      `,
    });
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
  currentUserWebId: string,
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
    const resourceHash = thingUrl.includes("#") ? `${thingUrl.split("#")[1]}` : "";
    // Only consider resources
    if (resourceHash.includes('/')) {
      const whatKind = getIri(thing, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") || "N/A";
      const sharedHashes = getIriAll(thing, "https://www.w3.org/ns/activitystreams#Offer") || ["N/A"];
      const usersSharedWith = thingsUsersSharedWithParse(sharedHashes, things, i);
      const owner = currentUserWebId;

      sharedItems.push({
        resourceHash,
        usersSharedWith,
        owner,
        whatKind
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
  let userIndex = 0
  while (index < things.length && userIndex < userHashes.length) {
    // See is the current thing is a user hash
    if (userHashes[userIndex] === things[index].url) {
      const created =
        getDatetime(
          things[index], "http://purl.org/dc/terms/created")?.toISOString() 
          || "N/A";
      const sharedWith =
        getUrl(
          things[index],
          "https://www.w3.org/ns/activitystreams#target"
        ) || "N/A";
      const resourceUrl =
        getUrl(
          things[index],
          "http://www.w3.org/ns/auth/acl#accessTo"
        ) || "N/A";
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
export async function getSharedWithMe(rootPodUrl: string): Promise<sharedSomething[]> {
  // Load the dataset from the TTL file.
  const sharedWithMeUrl = `${rootPodUrl}inbox/sharedWithMe.ttl`;
  const dataset = await getSolidDataset(sharedWithMeUrl, { fetch });
  const things: Thing[] = getThingAll(dataset);
  const sharedItems: sharedSomething[] = [];

  things.forEach((thing) => {
    const resourceHash = thing.url.includes("#") ? thing.url.split("#")[1] : "";
    const creator = getUrl(thing, "http://purl.org/dc/terms/creator") || "N/A";
    const created = getDatetime(thing, "http://purl.org/dc/terms/created")?.toISOString() || "N/A";
    const accessTo = getUrl(thing, "http://www.w3.org/ns/auth/acl#accessTo") || "N/A";
    const accessModes = getIriAll(thing, "http://www.w3.org/ns/auth/acl#mode") || ["N/A"];
    const whatKind = getIri(thing, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") || "N/A";

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
  });

  return sharedItems;
}
