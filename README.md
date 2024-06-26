# TRIPLE_upload_dev

## This is an early workflow for: 
1. Setting up and locally hosting Solid pod
2. Uploading data into that pod via the TRIPLE App
3. Future aims -- see pod contents, edit data privacy, query data via sparql queries


#### Requirements:
- [Node.js](https://nodejs.org/en/)
    -Version 18 or higher.

#### Getting Started:
1. Navigate to the webpage (where there are some nice instructions):

   `https://ecrum19.github.io/TRIPLE_App/`


#### Notes:
**General issues:**

- The Pod Browser does not work properly yet. That is something that will be implemented in the near future.
- When uploading a file, the "Success" message will almost always appear (has to do with Promise handling). I will fix this issue and add a loading icon while file is uploading soon as well.
- If weird things start to happen with athn issues, clear browser history and cookies and it should fix things.

#### TO DO:
- (Optional) -- 
  - A. ...
  - B. Fix Pod Browser so that it actually displays pod contents
  

**Data Upload:**

1. A way to designate where a file is uploaded to (i.e. directory structure)
2. A loading icon (to tell when file upload is done)
3. A way to display document metadata

**Data Browser:**

4. A Pod data browser that actually works...
5. Designate a way to display the directory structure (along with the files)

**Data Query:**

6. Area to write the query
7. Area to designate sources
8. Submit query button
9. Streamed output display

**Data Privacy:**

10. A view of the current privacy
11. A way to add/change privacy
