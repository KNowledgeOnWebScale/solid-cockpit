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
  import { getPodURLs } from "./login";


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
 * Gets the current ACL file from a Pod's /Uploads container. (a bit of a mess rn)
 *
 * @param datasetWithAcl A Solid dataset (obtained from a Pod URL) with or without an ACL file
 * @returns an AclDataset that represents the current ACL for the Pod's /Uploads container 
 */
async function obtainACL(datasetWithAcl) {
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