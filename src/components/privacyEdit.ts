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
  getEffectiveAccess,
  
} from "@inrupt/solid-client";
import { fetch } from "@inrupt/solid-client-authn-browser";



export function hasAccess(
  resource: Parameters<typeof getEffectiveAccess>[0],
  access: Array<keyof ReturnType<typeof getEffectiveAccess>["user"]>,
): boolean {
  const actualAccess = getEffectiveAccess(resource);
  const hasRequiredAccess = access.every(
    (requiredAccess) => actualAccess.user[requiredAccess] === true,
  );
  return hasRequiredAccess;
}


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


export type FileData = WithServerResourceInfo & {
  blob: Blob;
  etag: string | null;
};

/**
 * Function to fetch file data from a pod.
 *  
 */ 
const fetcher = async ([url, _webId]: [
  UrlString,
  UrlString | undefined,
]): Promise<FileData | (SolidDataset & WithServerResourceInfo)> => {
  const urlObject = new URL(url);
  // Ensure that when we fetch a Container that contains an `index.html`,
  // the server doesn't serve us that HTML file:
  const headers = urlObject.pathname.endsWith("/")
    ? { Accept: "text/turtle" }
    : {
        // Otherwise ask the server to give us Turtle if it _can_ be served as
        // Turtle. If not, serve it up in the most appropriate Content-Type:
        Accept: "text/turtle;q=1.0, */*;q=0.5",
      };
  const response = await fetch(url, { headers: headers });
  const resourceInfo = responseToResourceInfo(response);
  if (isRawData(resourceInfo)) {
    return {
      ...resourceInfo,
      blob: await response.blob(),
      etag: response.headers.get("ETag"),
    };
  }
  if (response.headers.get("Content-Type") === "application/ld+json") {
    // Some Solid servers (at least NSS) will default to serving content
    // available as JSON-LD as JSON-LD. Since we only ship a Turtle parser,
    // re-request it as Turtle instead:
    return await getSolidDataset(url, { fetch: fetch });
  }
  const dataset = await responseToSolidDataset(response);
  return dataset;
};

function getResourceUrl(url: UrlString): UrlString {
  const resourceUrl = new URL(url);
  resourceUrl.hash = "";
  return resourceUrl.href;
}

export function useResource(url: UrlString | null) {
  const resourceUrl = url ? getResourceUrl(url) : null;
  const sessionInfo = useSessionInfo();
  const resource = useSwr(
    resourceUrl ? [resourceUrl, sessionInfo?.webId] : null,
    fetcher,
  );



//
//async function generateDefaultACL(containerURL: string) {
//  const resourceDetails = await getResourceInfo(containerURL);
//  const newACL = createAclFromFallbackAcl(await getResourceInfo(containerURL));
//}

export { obtainSolidDataset, obtainACL, editACL, fetcher }