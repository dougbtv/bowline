#!/bin/bash
mongoexport --db bowline --collection releases --out json/releases.json
mongoexport --db bowline --collection users --out json/users.json

