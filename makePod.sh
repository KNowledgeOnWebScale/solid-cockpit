#!/bin/bash

npx @solid/community-server -p 3000 -c @css:config/file.json -f .data


# if ls "$(pwd)/.data" >dev/null 2>&1; then
    # start existing CSS instance ??
# else 
    # install CSS
    # start CSS instance??
# fi