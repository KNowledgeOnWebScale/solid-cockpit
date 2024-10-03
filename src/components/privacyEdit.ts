import {
  getContainedResourceUrlAll,
  getResourceInfo,
  getSolidDataset,
  getSolidDatasetWithAcl,
  hasResourceAcl,
  getResourceAcl,
  hasAccessibleAcl,
  hasFallbackAcl,
  setAgentResourceAccess,
  getAgentAccess,
  WithResourceInfo,
  createAclFromFallbackAcl,
  createAcl,
  AclDataset,
  SolidDataset,
  saveSolidDatasetAt,
  WithServerResourceInfo,
  WithAccessibleAcl,
  WithAcl,
  createSolidDataset,
  WithFallbackAcl,
  createThing,
  getSourceUrl,
  ThingPersisted,
  UrlString,
  responseToResourceInfo,
  isRawData,
  responseToSolidDataset,
  getLinkedResourceUrlAll,
  hasServerResourceInfo,
  getEffectiveAccess,
  
} from "@inrupt/solid-client";
import { fetch } from "@inrupt/solid-client-authn-browser";
import { WorkingData, fetchData } from "./getData"
import { getPodURLs, currentWebId } from "./login";


export type Permissions = {
  read: boolean,
  append: boolean,
  write: boolean,
  control: boolean
}

/**
 * Function that checks if an input string is a valid URL
 * 
 * @param urlString A string to be checked if it is a valid URL
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
 * 
 * @param resourceAcl 
 * @returns an AclDataset that represents the current ACL for the Pod's /Uploads container 
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

export const { freeze } = Object;

/**
 * function adopted from the 
 * @param targetResource 
 * @returns 
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
 * Adds a new .acl file with default permissions (i.e. only owner has "Control" access)
 * 
 * @param resourceURL The URL of the conatainer that needs an ACL configured
 * @param userWebId The webID that base level access rights should be granted to
 * @param rights a 4 item list that contains boolean values for [read, append, write, control] access rights
 */
export async function generateAcl(resourceURL: string, userWebId: string) {
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

  console.log(savedAclDataset)
}
//
//async function generateDefaultACL(containerURL: string) {
//  const resourceDetails = await getResourceInfo(containerURL);
//  const newACL = createAclFromFallbackAcl(await getResourceInfo(containerURL));
// }
