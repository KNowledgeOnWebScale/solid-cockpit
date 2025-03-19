import {
  getSolidDatasetWithAcl,
  getResourceAcl,
  hasAccessibleAcl,
  setAgentResourceAccess,
  setPublicResourceAccess,
  WithResourceInfo,
  AclDataset,
  SolidDataset,
  saveSolidDatasetAt,
  WithServerResourceInfo,
  WithAcl,
  createSolidDataset,
  getSourceUrl,
  UrlString,
  createThing,
  getSolidDataset,
  buildThing,
  Thing,
  getThing,
  setThing,
  createContainerAt,
  addUrl,
} from "@inrupt/solid-client";
import { fetch } from "@inrupt/solid-client-authn-browser";
import { WorkingData, fetchData, fetchPermissionsData } from "./getData";
import { generateHash } from "./queryPod";

export type Permissions = {
  read: boolean;
  append: boolean;
  write: boolean;
  control: boolean;
};

export const { freeze } = Object;

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
  const solidDataWAcl = await getSolidDatasetWithAcl(url, { fetch: fetch });
  const resourceAcl = getResourceAcl(solidDataWAcl);
  const updatedAcl = setAgentResourceAccess(resourceAcl, user, accessLevel);
  await saveAclFor(solidDataWAcl, updatedAcl);
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
  const solidDataWAcl = await getSolidDatasetWithAcl(url, { fetch: fetch });
  const resourceAcl = getResourceAcl(solidDataWAcl);
  const updatedAcl = setPublicResourceAccess(resourceAcl, accessLevel);
  await saveAclFor(solidDataWAcl, updatedAcl);
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

  const savedDataset = await saveSolidDatasetAt(
    location.internal_resourceInfo.aclUrl,
    updatedNewAcl,
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
    const updatedAclDataset = setPublicResourceAccess(aclDataset, {
      read: false,
      append: true,
      write: false,
      control: false,
    });
    // // Save the updated ACL dataset
    await saveAclFor(solidDataWAcl, updatedAclDataset);

    console.log(`ACL set: Public append access granted to ${inboxUrl}`);
  } catch (error) {
    console.error("Error creating inbox container or setting ACL:", error);
  }
}

/**
 * Creates and uploads a Turtle file (.ttl) that records resources/containers shared with this user in pod inbox/ container.
 *
 * Each shared resource is represented as an entry with the form:
 *
 *     <hash> a
 *
 * @param podUrl - The user's Solid Pod URL where sharedWithMe.ttl is stored
 * @param resourceUrl - The URL of the resource that was shared
 * @param sharedBy - The WebID of the person who shared the resource
 * @param accessModes - Array of access modes (e.g., ['Read', 'Write'])
 */
export async function createSharedWithMe(podUrl: string): Promise<void> {
  const sharedWithMeUrl = `${podUrl}inbox/`;
  const fileName = "sharedWithMe.ttl";

  let dataset: SolidDataset;
  try {
    // Attempt to fetch the existing dataset
    dataset = await getSolidDataset(sharedWithMeUrl + fileName, { fetch });
    return;
  } catch (error) {
    console.log(`No ${fileName} found, creating a new one...`);
  }

  // makes new sharedWithMe.ttl
  try {
    console.log("Creating new sharedWithMe.ttl file...");
    dataset = createSolidDataset();
    const hash = generateHash(10);
    const subjectUri = `${sharedWithMeUrl}${fileName}#${hash}`;
    let newDatasetThing: Thing = createThing({ url: subjectUri });
    newDatasetThing = buildThing(newDatasetThing)
      .addIri(
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        "http://www.w3.org/ns/iana/media-types/example"
      )
      .addStringNoLocale(
        "http://www.w3.org/ns/iana/media-types/example#placeholder",
        "empty"
      ) // placeholder to say nothing is here yet...
      .build();
    dataset = setThing(dataset, newDatasetThing);
    // Saves new sharedWithMe.ttl
    await saveSolidDatasetAt(sharedWithMeUrl + fileName, dataset, { fetch });
    console.log(`CREATED sharedWithMe.ttl with a placeholder message`);
  } catch (error) {
    console.error("Something went wrong ...");
    return;
  }
}

// TODO: Figure out why 409 and 409 errors ??
// TODO: Create methods to infer different content types and record them as such
// TODO: Method to check if inbox of other user exists and POST data to them
// TODO: Integrate this shring functionality in Query component

/**
 * Creates or updates a (.ttl) file that records resources/containers this user has shared with others.
 * user has shared with others in the pod root container.
 *
 * Each entry is recorded as an entry like:
 *
 *     <resourceUrl> DC:sharedBy <WebId>;
 *         {if a resource} a LDP:Resource ;
 *         {if a container} a LDP:Container ;
 *         {if container} LDP:contains <URL>, <URL> ;
 *         ACL:accessTo <URL> ;
 *         ACL:mode <access_mode>, <access_mode> ;
 *         TIME:date "date"^^dateformat .
 *
 * @param podUrl - The user's Solid Pod URL where sharedWithMe.ttl is stored
 * @param resourceUrl - The URL of the resource that was shared
 * @param sharedWith - The WebID of the person who shared the resource
 * @param accessModes - Array of access modes (e.g., ['Read', 'Write'])
 * 
 * @return a string with a message representative of success or failure
 */
export async function updateSharedWithOthers(
  podUrl: string,
  resourceUrl: string,
  sharedWith: string,
  accessModes: Permissions
): Promise<string> {
  const TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
  const ACL = "http://www.w3.org/ns/auth/acl#"; // Access Control
  const DCTERMS = "http://purl.org/dc/terms/"; // Metadata Terms
  const PIM = "http://www.w3.org/ns/pim/space#"; // Storage-related Vocabulary
  const LDP = "http://www.w3.org/ns/ldp#"; // Linked Data Platform
  const FOAF = "http://xmlns.com/foaf/0.1/"; // Friend-of-a-Friend (for social aspects)
  const EX = "http://www.w3.org/ns/iana/media-types/example#placeholder"; // example placeholder content for initialization of sharedWithMe.ttl
  const CREATED = "http://purl.org/dc/terms/created";

  const sharedWithMeUrl = `${podUrl}inbox/`;
  const fileName = "sharedWithOthers.ttl";
  let exists = false;

  let dataset: SolidDataset, newDatasetThing: Thing, message: string;
  try {
    // Attempt to fetch the existing dataset
    dataset = await getSolidDataset(sharedWithMeUrl + fileName, { fetch });
    exists = true;
  } catch (error) {
    console.log(`No ${fileName} found, creating a new one...`);
  }

  // acccess rights to be specified
  const givenAccess:string[] = []
  if (accessModes.read) {
    givenAccess.push("Read");
  }
  if (accessModes.write) {
    givenAccess.push("Write");
  }
  if (accessModes.append) {
    givenAccess.push("Append");
  }
  if (accessModes.control) {
    givenAccess.push("Control");
  }

  // Create new thing for shared resource
  let newThingBuilder = buildThing(createThing({ url: resourceUrl }))
      .addUrl(DCTERMS + "sharedWith", sharedWith) // Who shared it
      .addIri(TYPE, LDP + 'Resource') // what it is
      .addUrl(ACL + "accessTo", resourceUrl) // What was shared
      .addDatetime(`${CREATED}`, new Date())
      givenAccess.forEach((mode) => {
        newThingBuilder = newThingBuilder.addIri(ACL + "mode", ACL + mode); // access modes
      });
      const newThing = newThingBuilder.build();

  // if sharedWithOthers.ttl file already exists
  if (exists) {
    dataset = setThing(dataset, newThing);
    try {
      // Try to retrieve the dataset (container) and save updated dataset
      dataset = await saveSolidDatasetAt(sharedWithMeUrl, dataset, { fetch });
      message = `UPDATED sharedWithOthers.ttl which now includes: ${resourceUrl}`;
    } catch (error) {
      message = `Encountered an error ...`
    }
  } else {
    dataset = createSolidDataset();
    try {
      // Try to retrieve the dataset (container) and save updated dataset
      dataset = await saveSolidDatasetAt(sharedWithMeUrl, dataset, { fetch });
      message = `CREATED sharedWithOthers.ttl which now includes: ${resourceUrl}`;
    } catch (error) {
      message = `Encountered an error ...`
    }
  }
  return message;
}

//TODO: The functions above should be triggered when altering an ACL file (and called within those functions probably...)
