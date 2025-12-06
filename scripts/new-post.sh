#!/bin/bash

# Get current date and time
DATE=$(date +"%Y-%m-%d")
DATETIME=$(date +"%Y-%m-%d %H:%M:%S %z")
YEAR=$(date +"%Y")
MONTH=$(date +"%m")

# Always use suffix, starting with -1
COUNTER=1
FILENAME="_posts/${DATE}-${COUNTER}.md"

# Check if file exists and find available suffix
while [ -f "${FILENAME}" ]; do
  COUNTER=$((COUNTER + 1))
  FILENAME="_posts/${DATE}-${COUNTER}.md"
done

# Image filename matches post suffix
IMAGE_FILENAME="${DATE}-${COUNTER}.jpg"

# Generate frontmatter
cat > "${FILENAME}" <<EOF
---
layout: post
date: ${DATETIME}
image: /assets/images/${YEAR}/${MONTH}/${IMAGE_FILENAME}
width: 5350
height: 3602
tags:
---
EOF

# Output the created file path
echo "Created: ${FILENAME}"
