#!/bin/bash
current_directory=$(pwd)

# launches 
npx @solid/community-server -p 3000 -c $current_directory/config/tripleCSS-config.json -f .data