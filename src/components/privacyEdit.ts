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
  saveAclFor,
  createAclFromFallbackAcl,
  AclDataset,
  SolidDataset,
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
 * Gets the current ACL file from a Pod's /Uploads container. (a bit of a mess rn)
 *
 * @param datasetWithAcl A Solid dataset (obtained from a Pod URL) with or without an ACL file
 * @returns an AclDataset that represents the current ACL for the Pod's /Uploads container 
 */
export async function changeAcl(myWebId: string, url: UrlString, user: string, accessLevel: Permissions): Promise<void> {
  const solidDataWAcl = await getSolidDatasetWithAcl(url, { fetch: fetch });
  const agentAccess = getAgentAccess(solidDataWAcl, myWebId);
  // const working = hasResourceAcl(solidDataAcl);
  console.log(agentAccess);
  const resourceAcl = getResourceAcl(solidDataWAcl);
  const updatedAcl = setAgentResourceAccess(
    resourceAcl,
    user,
    accessLevel
  );
  console.log(resourceAcl);
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