import {
  getSolidDatasetWithAcl,
  getResourceAcl,
  hasAccessibleAcl,
  setAgentResourceAccess,
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
} from "@inrupt/solid-client";
import { fetch } from "@inrupt/solid-client-authn-browser";
import { WorkingData, fetchData } from "./getData"

export type Permissions = {
  read: boolean,
  append: boolean,
  write: boolean,
  control: boolean
}

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
    } 
    else {
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
  resourceAcl: SolidDataset,
): Promise<AclDataset & WithResourceInfo> {
  if (!hasAccessibleAcl(resource)) {
    throw new Error(
      `Could not determine the location of the ACL for the Resource at [${getSourceUrl(
        resource,
      )}];`,
    );
  }
  const savedDataset = await saveSolidDatasetAt(
    resource.internal_resourceInfo.aclUrl,
    resourceAcl,
    { fetch: fetch },
  );

  const savedAclDataset: AclDataset & typeof savedDataset = {
    ...savedDataset,
    internal_accessTo: getSourceUrl(resource),
  };

  return savedAclDataset;
}


/**
 * Changes the access control settings of the "Uploads" container using the editACL() method from Inrupt
 * Function changes rights based on user-input decisions.
 *
 * @param url A URL for a Solid Dataset with or without an ACL file
 * @param user The user WebID that will obtain new access rights
 * @param accessLevel a 4 item list that contains boolean values for [read, append, write, control] access rights
 * 
 * @returns an AclDataset that represents the updated ACL 
 */
export async function changeAcl(url: UrlString, user: string, accessLevel: Permissions): Promise<void> {
  const solidDataWAcl = await getSolidDatasetWithAcl(url, { fetch: fetch });
  const resourceAcl = getResourceAcl(solidDataWAcl);
  const updatedAcl = setAgentResourceAccess(
    resourceAcl,
    user,
    accessLevel
  );
  await saveAclFor(solidDataWAcl, updatedAcl);
}

/**
 * Function adopted from [https://github.com/inrupt/solid-client-js/blob/5d35c2e3bd40b3045b5b04ca9c7aa43865a39837/src/acl/acl.ts#L303]
 * Creates an empty .acl resource
 * 
 * @param targetResource a resource or container that does not have a defined .acl yet
 * @returns a blank .acl resource for the designated container or resource
 */
export function createNewAcl(
  targetResource: WorkingData 
): AclDataset {
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
export async function generateAcl(resourceURL: string, userWebId: string): Promise<AclDataset & WithResourceInfo> {
  // create blank ACL at current location
  const location = await fetchData(resourceURL);
  const newAcl = createNewAcl(location);

  // add base user permissions
  const userAccess:Permissions = {
    read: true,
    append: true,
    write: true,
    control: true
  }

  // add that root ACL info to empty acl
  const updatedNewAcl = setAgentResourceAccess(
    newAcl,
    userWebId,
    userAccess
  );

  const savedDataset = await saveSolidDatasetAt(
    location.internal_resourceInfo.aclUrl,
    updatedNewAcl,
    { fetch: fetch },
  );

  const savedAclDataset: AclDataset & typeof savedDataset = {
    ...savedDataset,
    internal_accessTo: getSourceUrl(location),
  };

  return savedAclDataset;
}

/**
 * Creates and uploads a Turtle file (.ttl) that records resources/containers shared with this user in the pod root container.
 *
 * Each shared resource is converted into an entry like:
 *
 *     <resourceUrl> DC:sharedBy <WebId>;
 *         ACL:accessTo <URL>;
 *         ACL:mode "access_modes";
 *         LDP:contains <URL>;
 *         TIME:date "date".
 *
 * @param podUrl - The user's Solid Pod URL where sharedWithMe.ttl is stored
 * @param resourceUrl - The URL of the resource that was shared
 * @param sharedBy - The WebID of the person who shared the resource
 * @param accessModes - Array of access modes (e.g., ['Read', 'Write'])
 */
export async function updateSharedWithMe(
  podUrl: string,
  resourceUrl: string,
  sharedBy: string,
  accessModes: string[]
): Promise<string> {
  const ACL = "http://www.w3.org/ns/auth/acl#"; // Access Control
  const DCTERMS = "http://purl.org/dc/terms/"; // Metadata Terms
  const PIM = "http://www.w3.org/ns/pim/space#"; // Storage-related Vocabulary
  const LDP = "http://www.w3.org/ns/ldp#"; // Linked Data Platform
  const FOAF = "http://xmlns.com/foaf/0.1/"; // Friend-of-a-Friend (for social aspects)


  const sharedWithMeUrl = `${podUrl}sharedWithMe.ttl`;

  let dataset: SolidDataset, newDatasetThing: Thing;
  try {
    // Attempt to fetch the existing dataset
    dataset = await getSolidDataset(sharedWithMeUrl, { fetch });
  } catch (error) {
    if (error.statusCode === 404) {
      console.log("Creating new sharedWithMe.ttl file...");
      newDatasetThing = createThing(); // Create an empty dataset if the file does not exist
    } else {
      console.error("Error accessing dataset:", error);
      return;
    }
  }

  // Check if the resource already exists in the dataset
  let resourceThing = getThing(dataset, resourceUrl);
  if (!resourceThing) {
    console.log("Adding new shared resource...");
    resourceThing = buildThing(createThing({ url: resourceUrl }))
    .addUrl(DCTERMS + "creator", sharedBy) // Who shared it
    .addUrl(ACL + "accessTo", resourceUrl) // What was shared
    .addStringNoLocale(ACL + "mode", accessModes.join(", ")) // Access rights
    .addUrl(LDP + "contains", resourceUrl) // Denotes whether it's a container
    .build();
  } else {
    console.log("Updating existing shared resource...");
    resourceThing = buildThing(resourceThing)
    .setUrl(DCTERMS + "creator", sharedBy)
    .setUrl(ACL + "accessTo", resourceUrl)
    .setStringNoLocale(ACL + "mode", accessModes.join(", ")) // Update access
    .setUrl(LDP + "contains", resourceUrl) // Ensures it's still recorded
    .build();
  }
  // Add the updated Thing to the dataset
  dataset = setThing(dataset, resourceThing);
  
  // Saves RDF data as sharedWithMe.ttl
  let message: string;
  try {
    // Try to retrieve the dataset (container) and save updated dataset
    dataset = await saveSolidDatasetAt(sharedWithMeUrl, dataset, { fetch });
    message = `UPDATED sharedWithMe.ttl which now includes: ${resourceUrl}`;
  } catch (error) {
    dataset = createSolidDataset();
    message = `CREATED sharedWithMe.ttl with first item: ${resourceUrl}`;
  }

  return message;
}

/**
 * Creates and uploads a Turtle file (.ttl) that records resources/containers this 
 * user has shared with others in the pod root container.
 *
 * Each entry is recorded as an entry like:
 *
 *     <resourceUrl> DC:sharedWith <WebId>;
 *         ACL:accessTo <URL>;
 *         ACL:mode "access_modes";
 *         LDP:contains <URL>;
 *         TIME:date "date".
 *
 * @param podUrl - The user's Solid Pod URL where sharedWithMe.ttl is stored
 * @param resourceUrl - The URL of the resource that was shared
 * @param sharedWith - The WebID of the person who shared the resource
 * @param accessModes - Array of access modes (e.g., ['Read', 'Write'])
 */
export async function updateSharedWithOthers(
  podUrl: string,
  resourceUrl: string,
  sharedWith: string,
  accessModes: string[]
): Promise<string> {
  const ACL = "http://www.w3.org/ns/auth/acl#"; // Access Control
  const DCTERMS = "http://purl.org/dc/terms/"; // Metadata Terms
  const PIM = "http://www.w3.org/ns/pim/space#"; // Storage-related Vocabulary
  const LDP = "http://www.w3.org/ns/ldp#"; // Linked Data Platform
  const FOAF = "http://xmlns.com/foaf/0.1/"; // Friend-of-a-Friend (for social aspects)


  const sharedWithMeUrl = `${podUrl}sharedWithOthers.ttl`;

  let dataset: SolidDataset, newDatasetThing: Thing;
  try {
    // Attempt to fetch the existing dataset
    dataset = await getSolidDataset(sharedWithMeUrl, { fetch });
  } catch (error) {
    if (error.statusCode === 404) {
      console.log("Creating new sharedWithMe.ttl file...");
      newDatasetThing = createThing(); // Create an empty dataset if the file does not exist
    } else {
      console.error("Error accessing dataset:", error);
      return;
    }
  }

  // Check if the resource already exists in the dataset
  let resourceThing = getThing(dataset, resourceUrl);
  if (!resourceThing) {
    console.log("Adding new shared resource...");
    resourceThing = buildThing(createThing({ url: resourceUrl }))
    // This is not valid and needs to be fixed
    .addUrl(DCTERMS + "sharedWith", sharedWith) // Who shared it
    .addUrl(ACL + "accessTo", resourceUrl) // What was shared
    .addStringNoLocale(ACL + "mode", accessModes.join(", ")) // Access rights
    .addUrl(LDP + "contains", resourceUrl) // Denotes whether it's a container
    .build();
  } else {
    console.log("Updating existing shared resource...");
    resourceThing = buildThing(resourceThing)
    // This is not valid and needs to be fixed
    .setUrl(DCTERMS + "sharedWith", sharedWith)
    .setUrl(ACL + "accessTo", resourceUrl)
    .setStringNoLocale(ACL + "mode", accessModes.join(", ")) // Update access
    .setUrl(LDP + "contains", resourceUrl) // Ensures it's still recorded
    .build();
  }
  // Add the updated Thing to the dataset
  dataset = setThing(dataset, resourceThing);
  
  // Saves RDF data as sharedWithMe.ttl
  let message: string;
  try {
    // Try to retrieve the dataset (container) and save updated dataset
    dataset = await saveSolidDatasetAt(sharedWithMeUrl, dataset, { fetch });
    message = `UPDATED sharedWithOthers.ttl which now includes: ${resourceUrl}`;
  } catch (error) {
    dataset = createSolidDataset();
    message = `CREATED sharedWithOthers.ttl with first item: ${resourceUrl}`;
  }

  return message;
}


//TODO: The functions above should be triggered when altering an ACL file (and called within those functions probably...)