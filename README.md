# TRIPLE_upload_dev

## This is an early workflow for: 
1. Setting up and locally hosting Solid pod
2. Viewing your pod and uploading data into that pod via the TRIPLE App


#### Requirements:
- [Node.js](https://nodejs.org/en/)
    -Version 18 or higher.

#### Setting up a local instance of a Solid pod:
1. Clone this git repo

   `git clone https://github.com/ecrum19/TRIPLE_App.git`

3. Navigate to the created directory

   `cd TRIPLE_App/`

5. Execute the following command:

   `bash makePod.sh`


#### Setting up the Solid pod
1. Using a web browser navigate to
    http://localhost:3000/

2. Click the link: "Sign up for an account"

3. Fill out the fields and click "Register"

4. On the "Your Account" page, click on "Create pod"

5. enter a name for the pod and click "Create pod"

6. Return to the home page by clicking "Back"

Voila, you now have a pod hosted by your local machine. Now, let us add something to it!

#### Launching the TRIPLE App
1. First install all dependencies: 

   `yarn install`

2. launch the web client via a local server (will be URL in the future)

   `yarn serve`

3. Navigate to the webpage at the following URL: http://localhost:8080/


#### TO DO:
- (Optional) -- 
  - A. A way for a user to select the pod (view/edit via dropdown)
  - B. ...

**General issues:**

- I. New pod initialization / old pod re-starting (CSS interface)
- II. The presence of `<http://www.w3.org/ns/pim/space#storage> <../> .` on User `card$.ttl`
- III. Web hosting of the application -- github pages

**Data Upload:**

1. A way to designate where a file is uploaded to (i.e. directory structure)
2. A drag and drop interface
3. A loading icon (to tell when file upload is done)

**Data Browser:**

4. A Pod data browser -- use new Comunica engine
5. Designate a way to display the directory structure (along with the files)

**Data Query:**

6. Area to write the query
7. Area to designate sources
8. Submit query button
9. Streamed output display

**Data Privacy:**

10. A view of the current privacy
11. A way to add/change privacy
