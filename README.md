# How to use tasks

Addresses on the rinkeby testnet:

```shell
Marketplace: 0x5761288b5Db09ab58669D12472F65d51e10b007d
TestERC721:0x169333Ca7CC7b8D925a79b5F86393AeF74Ea10B1
TestERC1155: 0x138Fa92f05b5739E9b56B5b9B18943d7eFEa54a4
TestERC20First: 0x2D2BDcC939Bc9937e06B214A5826305AF5eB8f47
TestERC20Second: 0x03bad8CB360cE004a009bDBC246921c8841Ba257
```


### Mint erc20 token for a given account. Accounts privates keys are stored in the keys folder.

```shell
npx hardhat mintERC20 --token-address 0x2D2BDcC939Bc9937e06B214A5826305AF5eB8f47 --account backendSigner --amount 100
```

### Mint erc721 token for a given account

```shell
npx hardhat mintERC721 --collection-address 0x169333Ca7CC7b8D925a79b5F86393AeF74Ea10B1 --account backendSigner
```

### Mint erc1155 token for a given account

```shell
npx hardhat mintERC1155 --collection-address 0x138Fa92f05b5739E9b56B5b9B18943d7eFEa54a4 --account backendSigner --amount 10
```