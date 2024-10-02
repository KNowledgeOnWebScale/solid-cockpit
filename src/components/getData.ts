import {
  FetchError,
  getSolidDataset,
  SolidDataset,
  WithServerResourceInfo,
  WithAcl,
  AgentAccess,
  UrlString,
  responseToResourceInfo,
  isRawData,
  responseToSolidDataset,
  getSolidDatasetWithAcl,
  getAgentAccessAll,
  getGroupAccessAll,
  getLinkedResourceUrlAll,
  hasServerResourceInfo,
  overwriteFile,
  getSourceUrl,
  getContentType,
  saveSolidDatasetAt,
  getResourceAcl,
  AclDataset,

} from "@inrupt/solid-client";

import { fetch } from "@inrupt/solid-client-authn-browser";
import { getPodURLs, currentWebId } from "./login";


/**
 * declares FileData type
 */
export type FileData = WithServerResourceInfo & {
  blob: Blob;
  etag: string | null;
};

/**
 * declares WorkingData type
 */
export type WorkingData = (SolidDataset & WithServerResourceInfo) | FileData;

/**
 * fetch variable that designates how to get data from Solid Pod API.
 * Specifically, is passed as a parameter into the SWRV function
 * 
 * @param url
 * @param _webId
 * 
 * @retuns dataset ...
 */
export async function fetchData(url: UrlString): Promise<WorkingData> {
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
}

/**
 * Determine whether a given URL (container or resource) has an attached .acl file
 * 
 * @param url a url to a pod container/resource
 * 
 * @retuns the .acl contents as an obj OR null if no .acl file exists
 */
export async function fetchPermissionsData(url: UrlString): Promise<AclDataset | null> {
  try {
    const solidDataWAcl = await getSolidDatasetWithAcl(url, { fetch: fetch });
    return getResourceAcl(solidDataWAcl);
  }catch (error) {
    return null;
  }
}

/**
 * Determines the list of users and access rights for a given resource or container
 * 
 * @param url a url to a pod container/resource from which we can get access information
 * 
 * @retuns an AgentAccess object with information about users and their access rights
 */
export async function fetchAclAgents(url: UrlString): Promise<AgentAccess | null> {
  return getAgentAccessAll(await getSolidDatasetWithAcl(url, { fetch: fetch }));
}


/**
 * gets a resource URL --
 * 
 * @param url
 * 
 * @retuns resourceURL ...
 */
function getResourceUrl(url: UrlString): UrlString {
  const resourceUrl = new URL(url);
  resourceUrl.hash = "";
  return resourceUrl.href;
}

