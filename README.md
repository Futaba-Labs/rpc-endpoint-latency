# rpc-endpoint-latency

## Install and Set configuration

Run the following command;

```sh
pnpm install
```

Add any rpc provider information in `rpc.json` (only mainnet)

```json
[
  {
    "name": "Alchemy",
    "rpcUrl": "https://eth-mainnet.g.alchemy.com/v2/"
  },
  {
    "name": "Infura",
    "rpcUrl": "https://mainnet.infura.io/v3/"
  }
]
```

## Measure latency

Run the following command;

```sh
pnpm run start -b <NUMBER_OF_BLOCKS> -i <POLLING_INTERVAL>
```

- `-b`: number of blocks to measure
- `-i`: frequency of polling (ms)

When execution is complete, the result is displayed on the console and output in json format in output.
