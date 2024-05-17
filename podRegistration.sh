#!/bin/bash

# get current dir and navigate to the user's WebID card
read -p "Enter the name of your pod: " pod
current_directory=$(pwd)

# designates the file to add the Pod info to
target_directory="$current_directory/.data/$pod/profile"
file_name="card$.ttl"
full_path="$target_directory/$file_name"

# check to make sure the directory is accurate
if [ ! -d "$target_directory" ]; then
    echo "Error: $target_directory does not exist..."
    exit 1
fi

# replaces the last "." with a ";" for ttl format continuity
to_replace="    a foaf:Person."
fixed="    a foaf:Person;"
awk -v search="$to_replace" -v replace="$fixed" '
{
    if ($0 == search) {
        print replace
    } else {
        print
    }
}' "$full_path" > temp && mv temp "$full_path"

# makes it visible where your pod is using <../pim/space#storage>
pod_path="    <http://www.w3.org/ns/pim/space#storage> <../>."
if ! grep -Fxq "$pod_path" "$full_path"; then
    echo "$pod_path" >> $full_path
    echo "Your pod is now registered!"
else
    echo "Your pod is already registered!"
fi