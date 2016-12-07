#!/bin/bash
# -------------------------------------------------
# Bootstraps a mongo container with the skeletal
# structure that's needed by Bowline.
# -------------------------------------------------

# Overall descriptions
SEMAPHORE_FILE=/data/db/.bowline_bootstrapped

# First thing's first... see if we've marked the semaphore that says everything's good to go
# (e.g. that the data's already bootstrapped.)
if [ -f $SEMAPHORE_FILE ]; then
  echo "Semaphore found, data already bootstrapped"
  exit 0
fi

# Start mongo
mongod &

# Set some maximums, and mark if mongo came up.
MAX_TRIES=5
tries=0
mongo_up=0

# Go into a loop looking for mongo coming up
while [ $tries -lt $MAX_TRIES  ] && [ $mongo_up -ne 1 ]; do
  echo -=-=-=-=-=-=-=-=- Mongo connection attempt $tries

  # Try to connect to the daemon
  echo "show dbs" | mongo

  # See if it came up OK.
  if [ $? -eq 0 ]; then
    mongo_up=1
  fi

  if [ $mongo_up -eq 0 ]; then
    let tries=tries+1
    sleep 1
  fi
done

# See if it came up.
if [ $mongo_up -eq 1 ]; then
  echo "Good mongo is up."
  # Go ahead and bootstrap it with the data here, and mark if there's a semaphore
  mongoimport --host localhost --db bowline --collection releases --file /exampledata/releases.json
  import_release=$?
  mongoimport --host localhost --db bowline --collection users --file /exampledata/users.json
  import_users=$?

  # Check that the imports were OK
  if [ $import_release -eq 0 ] && [ $import_users -eq 0 ]; then
    # Kill mongo
    echo "Shutting down mongod"
    kill $(pgrep mongod)
    # Need time for it to die.
    # A short wait should be fine, there's no other connections and it's a small data set.
    sleep 3

    # Mark the semaphor
    echo "Bowline bootstrapped" > $SEMAPHORE_FILE && date >> $SEMAPHORE_FILE

    # Say that we're done.
    echo "Mongo data imported. Semaphore created."
    exit 0

  else

    # That import failed.
    echo "Import FAILED."
    exit 1
  fi
else
  echo "Mongo connection failed"
  exit 1
fi
