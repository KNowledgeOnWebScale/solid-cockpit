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
  AclDataset,
  SolidDataset,
  saveSolidDatasetAt,
  WithServerResourceInfo,
  WithAcl,
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
export function checkUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return false;
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
 * Gets the current ACL file from a Pod's /Uploads container. (a bit of a mess rn)
 *
 * @param datasetWithAcl A Solid dataset (obtained from a Pod URL) with or without an ACL file
 * @returns an AclDataset that represents the current ACL for the Pod's /Uploads container 
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
 * Changes the access control settings of the "Uploads" container using the editACL() method from Inrupt
 * Function changes rights based on user-input decisions.
 * 
 * @param currentACL The current ACL file for the Uploads container
 * @param newAccessWebID The user(s) [as list of WebID strings] that will obtain new access rights
 * @param rights a 4 item list that contains boolean values for [read, append, write, control] access rights
 */
async function editACL(currentACL: AclDataset, newAccessWebIDs: string[], rights: boolean[]) {
  let updatedAcl: AclDataset;
  for (let i=0; i<newAccessWebIDs.length; i++) {
    updatedAcl = setAgentResourceAccess(
      currentACL,
      newAccessWebIDs[i],
      { read: rights[0], append: rights[1], write: rights[2], control: rights[3] }
    );
  }

// need resource of type WithAccessibleACL
// await saveAclFor(currentACL, updatedAcl);
}


//
//async function generateDefaultACL(containerURL: string) {
//  const resourceDetails = await getResourceInfo(containerURL);
//  const newACL = createAclFromFallbackAcl(await getResourceInfo(containerURL));
//}

export { editACL }