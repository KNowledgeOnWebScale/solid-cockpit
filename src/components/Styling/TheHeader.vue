<template>
  <v-card color="#ccdff8">
    <v-container>
      <v-row align="center" justify="center">
        <v-card-title justify="start">
          <h1>TRIPLE App</h1>
        </v-card-title>

        <!--
        <div class="account">
          <div class="text-center">
            <v-menu
              v-model="menu"
              :close-on-content-click="false"
              location="end"
            >
              <template v-slot:activator="{ props }">
                <v-btn
                  icon="mdi-account"
                  size="medium"
                  color="grey-darken-4"
                  justify="end"
                ></v-btn>
              </template>

              <v-card min-width="300">
                <v-list>
                  <v-list-item
                    subtitle="{{ webID }}"
                    title="WebID:"
                  ></v-list-item>

                <v-divider></v-divider>

                <v-list>
                  <div v-show="!loggedIn">
                    <v-list-item>
                        <v-btn
                          v-model="message"
                          color="blue"
                          label="Login"
                          @click= redirect...
                        ></v-btn>
                    </v-list-item>
                  </div>

                  <div v-show="loggedIn">
                  <v-list-item>
                    <v-switch
                      v-model="message"
                      color="blue"
                      label="Logout"
                      @click= redirect...
                    ></v-switch>
                  </v-list-item>
                  </div>
                </v-list>

                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn variant="text" @click="menu = false"> Cancel </v-btn>
                </v-card-actions>
              </v-card>
            </v-menu>
          </div>
        </div>
      -->
      </v-row>
    </v-container>
  </v-card>
</template>

<script lang="ts">
export default {
  data: () => ({
    loggedIn: false,
    webID: '',
    menu: false,
    message: false,
  }),
};
</script>

<style scoped>
h1 {
  color: rgb(0, 0, 0);
  margin: 0;
  font-family: "Courier New", monospace;
  font-size: 3rem; /* Adjust as needed */
  text-align: center;
}

.account {
  position: absolute;
  right: 0;
  top: 0;
  padding: 15px; /* Optional: adjust the padding as needed */
}
</style>
