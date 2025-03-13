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


/**
 * Random guide HTML code for installing and setting up a local instance of CSS...
 * 
 * <h2 class="req">1. Repo Cloning and Starting your local Solid pod</h2>
      <ol>
        <li>
          Clone the project git repo (it has some useful scripts for later).<br />For
          help see
          <a
            href="https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository"
            >git clone guide.</a
          >
        </li>
      </ol>
      <pre><code>$ git clone https://github.com/ecrum19/TRIPLE_App.git</code></pre>
      <ol start="2">
        <li>
          To start pod set-up, within the solid-cockpit/ directory execute the
          following command:
        </li>
      </ol>
      <pre><code>$ bash makePod.sh</code></pre>

      <hr />

      <h2 class="req">2. Setting up the Solid pod</h2>
      <ol>
        <li>
          Using a web browser navigate to
          <b><a href="http://localhost:3000/" target="_blank">http://localhost:3000/</a></b>
        </li>
        <li>Either <b><a href="http://localhost:3000/.account/login/password/register/" target="_blank">"Sign up"</a></b> or 
          <b><a href="http://localhost:3000/.account/login/password/" target="_blank">"Login"</a></b></li>
        <li>Once on the <b>"Your Account"</b> page, click on <b>"Create pod"</b></li>
        <li>Enter a name for the pod and click <b>"Create pod"</b></li>
        <li>Return to the home page by clicking <b>"Back"</b></li>
      </ol>
      <p>
        <b>Voila</b>, now you a pod! <strong>Time to return to the command line </strong>(briefly).<br />
        <span class="detail">
          (Please note that if the terminal window you executed the bash script [in step <b>1</b>-II] is terminated, 
          the Solid pod will no longer be accessible until it is re-launched (return to step <b>1</b>-II). 
          For more info see
          <a
            href="https://communitysolidserver.github.io/CommunitySolidServer/latest/"
            >Community Solid Server Documentation</a
          >.)
        </span>
      </p>

      <hr />

      <h2 class="req">3. Register your Pod on your new WebID</h2>
      <ol>
        <li>Within the TRIPLE_App/ directory, execute the command below:</li>
        <pre><code>$ bash podRegistration.sh</code></pre>
        <li>At the prompt, enter the name of your pod from above (E.g. test)</li>
      </ol>
      <p>
        Great, now <strong>we are finished with set-up!!</strong> 
        Return to the 
        <a href="">Solid Cockpit App</a> 
        for the next steps.<br />
      </p>
      <hr />

      <h2 class="req">4. Solid Pod Login within the TRIPLE App</h2>
      <ol>
        <li>
          Click the <b>"Data Upload"</b> tab in the nav bar within the TRIPLE
          App
        </li>
        <li>
          If you followed the above sections to launch a local Solid Pod, simply
          click the <b>"Login"</b> button that appears (because your pod provider is localhost:3000)
        </li>
        <li>After the redirect, click the <b>"Authorize"</b> button</li>
        <li>
          Once redirected back to the main page of the TRIPLE App, use the nav
          bar to select the <b>"Data Upload"</b> tab
        </li>
      </ol>

      <hr />

      <h2 class="req">5. Data Upload Functionality</h2>
      <ol>
        <li>Click the <b>"Data Upload"</b> tab of the nav bar above</li>
      </ol>

  * <style scoped>
  .entry {
    font-family: "Courier New", monospace;
    text-align: center;
  }

  .guide {
    text-align: Left;
  }

  .req {
    margin-top: 10px;
  }

  .detail {
    font-size: 0.9em;
  }

  p {
    margin-bottom: 15px;
  }

  body {
    line-height: 1.6;
    margin: 15px;
    background-color: #28353e;
  }

  code {
    background: #28353e;
    border: 1px solid #ddd;
    padding: 10px;
    border-radius: 5px;
    overflow-x: auto;
  }

  pre {
    padding-left: 10px;
    padding-bottom: 10px;
    margin-bottom: 15px;
  }

  ul,
  ol {
    margin-left: 20px;
    margin-bottom: 15px;
    margin-top: 5px;
  }

  ol li {
    margin-bottom: 10px;
    margin-left: 20px;
    list-style-type: upper-roman;
    align-items: Left;
  }

  a {
    color: #86b2df;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  .container {
    font-family: "Courier New", monospace;
    margin: auto;
    padding: 20px;
    background: #445560;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
 */




  // HTML from old Pod Browser data display (using a vuetify table)
  // <v-container>
  //   <v-col cols="12">
  //     <!-- Displays contents if the query returns results without an error -->
  //     <v-card
  //       title="Pod Contents"
  //       variant="tonal"
  //       justify="center"
  //       class="mx-auto"
  //       color="indigo-darken-3"
  //       v-if="queryItems !== null"
  //     >
  //       <v-infinite-scroll>
  //         <template v-for="(item, index) in queryItems" :key="index">
  //           <!-- need a clever way to filter and display results here -->
  //           <div :class="['pa-2', index % 1 === 0 ? 'bg-grey-lighten-2' : '']">
  //             {{ item }}
  //           </div>
  //         </template>
  //         <template v-slot:loading> </template>
  //       </v-infinite-scroll>
  //     </v-card>

  //     <!-- Displays warning if query encounters an error -->
  //     <v-card
  //       variant="tonal"
  //       justify="center"
  //       class="mx-auto"
  //       color="indigo-darken-3"
  //       v-if="queryItems === null"
  //     >
  //       <v-alert
  //         type="error"
  //         title="Error occurred when querying Pod with Comunica"
  //         >Apologies, but currently unable to display pod contents at the
  //         moment. Functionality will hopefully be fixed soon :/</v-alert
  //       >
  //     </v-card>
  //   </v-col>
  // </v-container>



  // TODO: filter functionality -- doesn't work and im sick of trying to figure it out -->
          // <!-- <li class="right">
          //     <div class="the-filter">
          //       <v-menu v-model="filterMenuOpen">
          //         <template v-slot:activator="{ props }">
          //           <v-btn
          //             icon="mdi-filter"
          //             variant="solo"
          //             color="#EDE7F6"
          //             rounded
          //             v-bind="props"
          //           >
          //           </v-btn>
          //         </template>
          //         <v-list>
          //           <v-list-item
          //             v-for="(item, index) in filters"
          //             :key="index"
          //             :value="index"
          //           >
          //               <v-switch
          //                 v-model="filterValues[index]"
          //                 color="primary"
          //                 :label="`${filters[index]}`"
          //                 hide-details
          //               ></v-switch>
          //           </v-list-item>
          //         </v-list>
          //       </v-menu>
          //     </div>
          //   </li>