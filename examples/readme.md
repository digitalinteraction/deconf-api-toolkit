# readme

```sh
# cd to/this/folder

# Make sure the root-level has npm dependencies installed

# Fill in the env
nano app.env

# Fill in the config
nano app-config.json

# Start up the database
docker-compose up -d

# Run the server
node -r ts-node/register express-app.ts
```
