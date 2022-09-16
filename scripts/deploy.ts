// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  let tx;
  const signers = await ethers.getSigners();

  // We get the contract to deploy
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(signers[0].address);

  await marketplace.deployed();

  console.log("Marketplace deployed to:", marketplace.address);

  let name = "testTokenERC721";
  let symbol = "TTERC721";
  const TestERC721 = await ethers.getContractFactory("TestCollectionERC721");
  const testERC721 = await TestERC721.deploy(name, symbol);

  await testERC721.deployed();
  console.log("TestERC721 deployed to:", testERC721.address);


  name = "testTokenERC1155";
  symbol = "TTERC1155";
  let uri = "uri";
  const TestERC1155 = await ethers.getContractFactory("TestCollectionERC1155");
  const testERC1155 = await TestERC1155.deploy(name, symbol, uri);

  await testERC1155.deployed();

  console.log("TestERC1155 deployed to:", testERC1155.address);

  name = "testTokenERC20First";
  symbol = "TTERC20";
  let TestERC20 = await ethers.getContractFactory("TestTokenERC20");
  let testERC20 = await TestERC20.deploy(name, symbol);

  await testERC20.deployed();
  console.log("TestERC20First deployed to:", testERC20.address);

  name = "testTokenERC20Second";
  symbol = "TTERC20";
  TestERC20 = await ethers.getContractFactory("TestTokenERC20");
  testERC20 = await TestERC20.deploy(name, symbol);

  await testERC20.deployed();
  console.log("TestERC20Second deployed to:", testERC20.address);

  tx = await testERC721.setApprovalForAll(marketplace.address, true);
  await tx.wait();

  tx = await testERC1155.setApprovalForAll(marketplace.address, true);
  await tx.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
