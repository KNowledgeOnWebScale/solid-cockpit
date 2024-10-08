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

