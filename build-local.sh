#!/bin/bash

# Default working directory for EAS local builds
# We use a directory in the home folder because /tmp is often a small tmpfs.
EAS_WORKING_DIR="${HOME}/.eas-build-local"

mkdir -p "$EAS_WORKING_DIR"

echo "Using EAS_LOCAL_BUILD_WORKINGDIR=$EAS_WORKING_DIR"

# Load .env file if it exists
if [ -f .env ]; then
  echo "Loading environment variables from .env"
  # Export variables starting with EXPO_PUBLIC_ (strip \r for Windows line endings)
  export $(sed 's/\r$//' .env | grep -v '^#' | grep 'EXPO_PUBLIC_' | xargs)
fi

# Run EAS build with the custom working directory
EAS_LOCAL_BUILD_WORKINGDIR="$EAS_WORKING_DIR" npx eas build --local "$@"

