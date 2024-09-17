<template>
  <head>
    <!-- Compiled and minified CSS -->
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css"
    />

    <link
      href="https://fonts.googleapis.com/icon?family=Material+Icons"
      rel="stylesheet"
    />
  </head>
  <v-card class="mx-auto" height="max" color="#b0c4de">
    <body>
      <v-container>
        <div class="navbar-fixed">
          <nav>
            <div class="nav-wrapper indigo lighten-3">
              <ul>
                <a href="#!" class="brand-logo">Privacy Editing</a>
                <div class="right">
                  <li>
                    <a href="#!"
                      ><i class="material-icons grey-text text-darken-1"
                        >view_list</i
                      ></a
                    >
                  </li>
                  <li>
                    <a href="#!"
                      ><i class="material-icons grey-text text-darken-1"
                        >info</i
                      ></a
                    >
                  </li>
                  <li>
                    <a href="#!"
                      ><i class="material-icons grey-text text-darken-1"
                        >notifications</i
                      ></a
                    >
                  </li>
                </div>
              </ul>
            </div>
          </nav>
        </div>
      </v-container>

      <v-container>
        <ul
          class="side-nav fixed floating indigo lighten-3 z-depth-0"
        >
          <li class="active">
            <a href="#"
              ><i class="material-icons purple-text text-darken-1">dashboard</i
              >My Pod</a
            >
          </li>
          <li>
            <a href="#"><i class="material-icons">people</i>Shared with me</a>
          </li>
          <li>
            <a href="#"><i class="material-icons">star</i>Starred</a>
          </li>
          <li>
            <a href="#"><i class="material-icons">delete</i>Trash</a>
          </li>
          <li><div class="divider"></div></li>
          <li>
            <a href="#"><i class="material-icons">cloud</i>Backup</a>
          </li>
          <li>
            <a href="#"><i class="material-icons">cloud</i>Backup</a>
          </li>
          
        </ul>
        
        <!-- need to figure out how to make container as large as needed for entries, now above determines vert len --> 
        <div class="main">
          <div class="container-fluid ">
            <ul>
              <li>
                <div class="card-panel folder">
                  <i class="material-icons left">folder</i>Folder
                </div>
              </li>
              <li>
                <div class="card-panel folder">
                  <i class="material-icons left">folder</i>Folder
                </div>
              </li>
              <li>
                <div class="card-panel folder">
                  <i class="material-icons left">folder</i>Folder
                </div>
              </li>
              <li>
                <div class="card-panel folder">
                  <i class="material-icons left">folder</i>Folder
                </div>
              </li>
            </ul>
          </div>
        </div>
      </v-container>
    </body>
  </v-card>
</template>

<script>
import { obtainSolidDataset } from "./privacyEdit";
import { currentWebId } from "./login";
import { getPodURLs } from "./fileUpload";

export default {
  data() {
    return {
      webId: "",
      podURLs: [],
      pod: "",
      dirContents: "",
    };
  },
  methods: {
    /*
    Calls getPodURLs() from fileUpload.ts to obtain a list of pods from the logged-in user's webID.
    Obtains 'pod' variable (URL path to user's Pod).
    */
    async getPodURL() {
      this.webId = currentWebId(); // fetches user webID from login.ts
      this.podURLs = await getPodURLs(this.webId); // calls async function to get Pod URLs
      this.pod = this.podURLs[0]; // can fix this to handle multiple pods (<< FUTURE >>)
    },
    async getPodData() {
      this.dirContents = await obtainSolidDataset(this.pod + "uploads/");
    },
  },
  mounted() {
    // Delays the execution of these functions on page reload (to avoid async-related errors)
    /*
    setTimeout(() => {
      this.getPodURL();
    }, 200);
    setTimeout(() => {
      this.getPodData();
    }, 400);
    */
  },
};
</script>

<style scoped>
.container {
  position: absolute;
  max-width: 80%;
  background-color: #b0c4de;
}

body {
  background-color: #b0c4de;
  font-size: 13px;
}
.card,
.card-panal {
  padding: 15px, 20px;
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.14);
  background-color: #b0c4de;
}
.container-fluid {
  padding: 0 2.5rem;
  margin: auto;
  background-color: #b0c4de;
}
.row {
  margin: 0 -0.75rem;
  background-color: #b0c4de;
}
.main {
  position: absolute;
  width: calc(100% - 250px);
  top: 118px;
  margin-left: 240px;
  background-color: #b0c4de;
}

/* nav */
nav {
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.3);
  max-width: 90%;
}
nav ul li {
  text-align: center;
}
nav ul.right {
  padding-right: 12px;
}
nav ul.right li {
  max-width: 150px;
}
nav ul a {
  padding-right: 0 12px;
}
.nav-wrapper {
  padding-left: 12px;
}
.nav-wrapper ul a:hover {
  background-color: transparent;
}
.nav-wrapper .title {
  font-size: 1.4rem;
}
.nav-wrapper .btn-flat {
  background-color: #4285f4 !important;
  font-size: 13px;
  font-weight: 500;
  height: 30px;
  line-height: 30px;
  width: 94px;
}
.nav-2,
.nav-2 i {
  height: 56px !important;
  line-height: 56px !important;
  min-height: 56px !important;
}

/*sidenav*/
.side-nav.floating {
  width: 250px;
  padding: 5px 2px 0 !important;
  height: calc(100% - 130px);
  left: initial;
  right: initial;
  top: 125px;
  transform: initial;
  z-index: auto;
  margin: 0.5rem 0 1rem 0;
  border-radius: 2px;
  background: transparent;
  box-shadow: none;
}
.side-nav .divider {
  margin: 8px 0;
}
.side-nav .active {
  background-color: rgba(0, 0, 0, 0.05);
}
.side-nav .active a {
  color: #212121;
  font-weight: 500;
}
.side-nav .subheader {
  line-height: 24px;
  height: 32px;
  margin: 0;
  padding: 4px 16px;
  color: #616161;
  font-weight: normal;
  font-size: 13px;
}
.side-nav li a,
.side-nav li a i.material-icons {
  height: 40px;
  line-height: 40px;
}
.side-nav li a i.material-icons {
  margin-right: 24px;
  margin-top: -3px;
}
.side-nav li a {
  padding: 4px 16px;
  font-weight: normal;
  font-size: 13px;
  color: #616161;
}
.side-nav li a:hover {
  border-radius: 2px;
}

/*folders*/
.folder {
  width: 90%;
  display: inline-block;
  margin: 3px 0px 0px 0;
  font-weight: 500;
}
.folder i {
  color: rgba(0, 0, 0, 0.54);
  margin-top: -3px;
}
</style>
