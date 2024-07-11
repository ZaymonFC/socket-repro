
## Instructions
Build `ssc` from source using the `next` branch
```sh
git clone git@github.com:socketsupply/socket.git
cd socket
git checkout next
./bin/install.sh
```

Build the bundle and invoke socket:

```sh
pnpm build
ssc build -r
```

To run with socket pointing at the dev-server:
```sh
pnpm dev
# In another terminal
ssc build -r --port 5173
```
