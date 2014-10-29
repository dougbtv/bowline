#!/bin/bash
echo "Clearing all collections..."
function clearCollection {
    mongo <<EOF
    use bowline
    db.releases.remove({})
    db.users.remove({})
EOF
}
clearCollection

echo "Now importing everything..."

mongoimport --db bowline --collection releases --file json/releases.json
mongoimport --db bowline --collection users --file json/users.json
