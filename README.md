# rpc-endpoint-latency

To measure the performance of the rpc endpoint, this repository measures the latency of getting the block timestamp and the actual block information.

## Install and Set configuration

Run the following command;

```sh
pnpm install
```

Add any rpc provider information in `rpc.json`

```sh
cp rpc.example.json rpc.json
```

Example configuration;
```json
{
  "provider": {
    "mainnet": [
      {
        "name": "alchemy",
        "rpcUrl": "https://eth-mainnet.g.alchemy.com/v2",
        "wssUrl": "wss://eth-mainnet.g.alchemy.com/v2"
      },
      {
        "name": "validation-cloud",
        "rpcUrl": "https://mainnet.ethereum.validationcloud.io/v1",
        "wssUrl": "wss://mainnet.ethereum.validationcloud.io/v1"
      }
    ],
    "arbitrum": [
      {
        "name": "validation-cloud",
        "rpcUrl": "https://mainnet.arbitrum.validationcloud.io/v1",
        "wssUrl": "wss://mainnet.arbitrum.validationcloud.io/v1"
      }
    ]
  },
  "polling": {
    "mainnet": [
      {
        "interval": 200,
        "rpcUrl": "https://eth-mainnet.g.alchemy.com/v2"
      },
      {
        "interval": 300,
        "rpcUrl": "https://eth-mainnet.g.alchemy.com/v2"
      }
    ],
    "base": [
      {
        "interval": 200,
        "rpcUrl": "https://base-mainnet.g.alchemy.com/v2"
      },
      {
        "interval": 300,
        "rpcUrl": "https://base-mainnet.g.alchemy.com/v2"
      }
    ]
  },
  "transfer": {
    "arbitrum-sepolia": [
      {
        "name": "alchemy",
        "account": "0xa33b050a4Be934A04E8D24C46d97b1C961E1d73F",
        "rpcUrl": "https://arb-sepolia.g.alchemy.com/v2"
      },
      {
        "name": "sequencer",
        "account": "0x7FA3fEC34a2f6Ef710c301742e81286353413bc9",
        "rpcUrl": "https://sepolia-rollup-sequencer.arbitrum.io/rpc"
      }
    ]
  }
}
```

Set environment variables (private keys for the accounts to use for testing transfer)

```sh
cp .env.example .env
```

## Measure latency

### Polling
Compare the block retrieval latency for each polling interval of HTTP polling.

```sh
pnpm run start:polling -b <NUMBER_OF_BLOCKS> -c <CHAIN_NAME>
```

- `-b`: number of blocks to measure (default: `10`)
- `-c`: chain name (default: `mainnet`)

When execution is complete, the result is displayed on the console and output in json format in `output`.

### Websocket

Compare latency of block fetches with websocket and http polling.

```sh
pnpm run start:websocket -c <CHAIN_NAME> -b <NUMBER_OF_BLOCKS> -i <POLLING_INTERVAL>
```

- `-c`: chain name (default: `mainnet`)
- `-b`: number of blocks to measure (default: `10`)
- `-i`: frequency of polling (ms) (default: `4000ms`)

When execution is complete, the result is displayed on the console and output in json format in `output`.


### RPC Provider
Compare the block retrieval latency of HTTP polling across different RPC providers.

```sh
pnpm run start:provider -c <CHAIN_NAME> -b <NUMBER_OF_BLOCKS> -i <POLLING_INTERVAL> -w <USE_WEBSOCKET>
```

- `-c`: chain name (default: `mainnet`)
- `-b`: number of blocks to measure (default: `10`)
- `-i`: frequency of polling (ms) (default: `4000ms`)
- `-w`: use websocket (default: `false`)

When execution is complete, the result is displayed on the console and output in json format in `output`.

### Transfer
Measure the latency of transferring funds between rpc endpoints.

```sh
pnpm run start:transfer -c <CHAIN_NAME> -i <ITERATION>
```

- `-c`: chain name (default: `arbitrum-sepolia`)
- `-i`: number of iterations (default: `10`)

