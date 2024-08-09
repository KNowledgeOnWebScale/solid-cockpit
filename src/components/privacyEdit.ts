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
  saveAclFor,
  createAclFromFallbackAcl,
  AclDataset,
  SolidDataset,
  WithServerResourceInfo,
  WithAcl,
} from "@inrupt/solid-client";

import { fetch } from "@inrupt/solid-client-authn-browser";

/**
 * Gets the a SolidDataset from the current Pod's /Uploads container.
 *
 * @param podURL The URL of the current Pod represented as a string
 * @returns a SolidDataset representation of the Pod's /Uploads container 
 */
async function obtainSolidDataset(podURL: string): Promise<SolidDataset & WithServerResourceInfo> {
  const dataWacl = await getSolidDataset(podURL+"uploads/example.ttl", {fetch: fetch})
  console.log(dataWacl)
  return dataWacl;
  // can't get items as SoldDatasets?? Something weird with file types I think?
  // Need way to get all the resources found in a directory... (not sure how to do this?)
} 

/**
 * Gets the current ACL file from a Pod's /Uploads container.
 *
 * @param datasetWithAcl A Solid dataset (obtained from a Pod URL) with or without an ACL file
 * @returns an AclDataset that represents the current ACL for the Pod's /Uploads container 
 */
function obtainACL(datasetWithAcl: SolidDataset & WithServerResourceInfo & WithAcl): AclDataset {
  let resourceAcl: AclDataset;
  if (!hasResourceAcl(datasetWithAcl)) {
    if (!hasAccessibleAcl(datasetWithAcl)) {
      throw new Error(
        "The current user does not have permission to change access rights to this Resource."
      );
    }
    if (!hasFallbackAcl(datasetWithAcl)) {
      throw new Error(
        "The current user does not have permission to see who currently has access to this Resource."
      );
      // Alternatively, initialise a new empty ACL as follows,
      // but be aware that if you do not give someone Control access,
      // **nobody will ever be able to change Access permissions in the future**:
      // resourceAcl = createAcl(myDatasetWithAcl);
    }
    resourceAcl = createAclFromFallbackAcl(datasetWithAcl);
  } else {
    resourceAcl = getResourceAcl(datasetWithAcl);
  }
  return resourceAcl;
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

export { obtainSolidDataset, obtainACL, editACL }