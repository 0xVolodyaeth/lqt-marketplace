import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import { readFile, readFileSync } from "fs";
import { Wallet } from "ethers";
import { ethers } from "ethers";
import { resolve } from "path";
// import { * } from "./artifacts/TestCollectionERC721.sol/TestCollectionERC721.json";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("mintERC721", "mints erc721 for a given address",)
  .addParam("collectionAddress", "collection address on rinkeby")
  .addParam("account", "filename without extension from the keys folder")
  .setAction(async (taskArgs) => {
    const data = readFileSync(
      resolve("./keys", `${taskArgs.account}.json`),
      "utf-8");

    const privateKey = JSON.parse(data).key;

    const contractCompiled = readFileSync("./artifacts/contracts/TestCollectionERC721.sol/TestCollectionERC721.json", "utf-8");
    const signer = new ethers.Wallet(privateKey, ethers.providers.getDefaultProvider('rinkeby'));

    const accountBalance = await signer.getBalance();

    console.log(`
======== INFO ========

account ${taskArgs.account}, address: ${signer.address}, balance: ${accountBalance}
    `)

    const contract = new ethers.Contract(taskArgs.collectionAddress, JSON.parse(contractCompiled).abi, signer);

    let tokenId = await contract.tokenId();
    console.log("before mint", tokenId.toString());

    console.log("\n======= MINTING =======\n");
    let tx = await contract.connect(signer).mint();
    const res = await tx.wait();
    console.log("transaction hash", res.transactionHash);

    tokenId = await contract.tokenId();

    console.log("\n======== INFO ========")
    console.log("tokenId of minted token", tokenId.toString());
  });

task("mintERC1155", "mints erc155 for a given address",)
  .addParam("collectionAddress", "collection address on rinkeby")
  .addParam("amount", "amount of tokens to mint")
  .addParam("account", "filename without extension from the keys folder")
  .setAction(async (taskArgs) => {
    const data = readFileSync(
      resolve("./keys", `${taskArgs.account}.json`),
      "utf-8");

    const privateKey = JSON.parse(data).key;

    const contractCompiled = readFileSync("./artifacts/contracts/TestCollectionERC1155.sol/TestCollectionERC1155.json", "utf-8");
    const signer = new ethers.Wallet(privateKey, ethers.providers.getDefaultProvider('rinkeby'));

    const accountBalance = await signer.getBalance();

    console.log(`
======== INFO ========

account ${taskArgs.account}, address: ${signer.address}, balance: ${accountBalance}
    `)

    const contract = new ethers.Contract(taskArgs.collectionAddress, JSON.parse(contractCompiled).abi, signer);

    let tokenId = await contract.tokenId();
    console.log("before mint", tokenId.toString());

    console.log("\n======= MINTING =======\n");
    let tx = await contract.connect(signer).mint(taskArgs.amount);
    await tx.wait();

    tokenId = await contract.tokenId();

    console.log("\n======== INFO ========")
    console.log("tokenId of minted token", tokenId.toString());
  });

task("mintERC20", "mints erc20 for a given address",)
  .addParam("tokenAddress", "erc20 token address on rinkeby")
  .addParam("amount", "amount of tokens to mint")
  .addParam("account", "filename without extension from the keys folder")
  .setAction(async (taskArgs) => {
    const data = readFileSync(
      resolve("./keys", `${taskArgs.account}.json`),
      "utf-8");

    const privateKey = JSON.parse(data).key;

    const contractCompiled = readFileSync("./artifacts/contracts/TestTokenERC20.sol/TestTokenERC20.json", "utf-8");
    const signer = new ethers.Wallet(privateKey, ethers.providers.getDefaultProvider('rinkeby'));

    const accountBalance = await signer.getBalance();

    console.log(`
======== INFO ========

account ${taskArgs.account}, address: ${signer.address}, balance: ${accountBalance}
    `)

    const contract = new ethers.Contract(taskArgs.tokenAddress, JSON.parse(contractCompiled).abi, signer);

    console.log("\n======= MINTING =======\n");
    let tx = await contract.connect(signer).mint(taskArgs.amount);
    await tx.wait();

    console.log("\n======== INFO ========")
    console.log(`Minted ${taskArgs.amount} tokens to ${taskArgs.account}`);

    tx = await contract.connect(signer).approve("0x5761288b5Db09ab58669D12472F65d51e10b007d", 10000);
    await tx.wait()
  });

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity:
  {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1,
      },
    },
  },
  networks: {
    rinkeby: {
      url: process.env.RINKEBY_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
