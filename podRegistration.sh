#!/bin/bash

# get current dir and navigate to the user's WebID card
read -p "Enter the name of your pod: " pod
current_directory=$(pwd)
for _ in 1; do
    echo "$current_directory"
    current_directory=$(dirname "$current_directory")
done

# designates the file to add the Pod info to
target_directory="$current_directory/.data/$pod/profile"
file_name="card$.ttl"
full_path="$target_directory/$file_name"

# check to make sure the directory is accurate
if [ ! -d "$target_directory" ]; then
    echo "Error: $target_directory does not exist..."
    exit 1
fi

# replaces the "." with a ";" for ttl format continuity
to_replace="a foaf:Person."
fixed="a foaf:Person;"
sed -i "s@$to_replace@$fixednew-text@g" "$full_path"

# makes it visible where your pod is using <../pim/space#storage>
#echo "    <http://www.w3.org/ns/pim/space#storage> <../> ." >> $full_path