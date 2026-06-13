#!/bin/bash

# Navigate to the script's directory
cd "$(dirname "$0")"

# Set JAVA_HOME to Homebrew's OpenJDK 17 path
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export PATH="$JAVA_HOME/bin:$PATH"

echo "Using Java from: $JAVA_HOME"
java -version

# Load environment variables from .env if it exists
if [ -f .env ]; then
  echo "Loading environment variables from .env..."
  # Export variables while ignoring comments and empty lines
  export $(grep -v '^#' .env | xargs)
else
  echo "Warning: .env file not found. Running with system environment variables."
fi

# Run the spring-boot application using the Maven wrapper
./mvnw spring-boot:run
