"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const hardhat_1 = require("hardhat");
let leaves = [
    // {
    // 	"collectionAddress": "0x136ac9A9D59cfB320C8Ad17f9fD37b4988c5528e",
    // 	"nftId": 1,
    // 	"currencyAddress": "0x136ac9A9D59cfB320C8Ad17f9fD37b4988c5528e",
    // 	"price": 100,
    // 	"nonce": 1,
    // 	"amount": 10
    // },
    // {
    // 	"collectionAddress": "0x136ac9A9D59cfB320C8Ad17f9fD37b4988c5528e",
    // 	"nftId": 20,
    // 	"currencyAddress": "0x136ac9A9D59cfB320C8Ad17f9fD37b4988c5528e",
    // 	"price": 304,
    // 	"nonce": 2,
    // 	"amount": 100
    // },
    // {
    // 	"collectionAddress": "0x136ac9A9D59cfB320C8Ad17f9fD37b4988c5528e",
    // 	"nftId": 2,
    // 	"currencyAddress": "0x136ac9A9D59cfB320C8Ad17f9fD37b4988c5528e",
    // 	"price": 120,
    // 	"nonce": 3,
    // 	"amount": 3
    // },
    // {
    // 	"collectionAddress": "0x136ac9A9D59cfB320C8Ad17f9fD37b4988c5528e",
    // 	"nftId": 10,
    // 	"currencyAddress": "0x136ac9A9D59cfB320C8Ad17f9fD37b4988c5528e",
    // 	"price": 100,
    // 	"nonce": 4,
    // 	"amount": 1
    // },
    {
        "bid": [
            {
                "tt": "1",
                "collection": "0x136ac9A9D59cfB320C8Ad17f9fD37b4988c5528e",
                "id": "1",
                "amount": "1"
            }
        ],
        "ask": [
            {
                "tt": "1",
                "collection": "0x136ac9A9D59cfB320C8Ad17f9fD37b4988c5528e",
                "id": "1",
                "amount": "1"
            }
        ],
        "totalAmount": "5",
        "creationDate": "20",
        "expirationDate": "20",
        "index": "0",
        "hash": "",
        "amount": "",
        "signer": "",
        "rootSignature": "",
        "root": ""
    },
    {
        "bid": [
            {
                "tt": "1",
                "collection": "0x136ac9A9D59cfB320C8Ad17f9fD37b4988c5528e",
                "id": "1",
                "amount": "1"
            }
        ],
        "ask": [
            {
                "tt": "1",
                "collection": "0x136ac9A9D59cfB320C8Ad17f9fD37b4988c5528e",
                "id": "1",
                "amount": "1"
            }
        ],
        "totalAmount": "5",
        "creationDate": "20",
        "expirationDate": "20",
        "index": "1",
        "hash": "",
        "amount": "",
        "signer": "",
        "rootSignature": "",
        "root": ""
    },
    {
        "bid": [
            {
                "tt": "1",
                "collection": "0x136ac9A9D59cfB320C8Ad17f9fD37b4988c5528e",
                "id": "1",
                "amount": "1"
            }
        ],
        "ask": [
            {
                "tt": "1",
                "collection": "0x136ac9A9D59cfB320C8Ad17f9fD37b4988c5528e",
                "id": "1",
                "amount": "1"
            }
        ],
        "totalAmount": "5",
        "creationDate": "20",
        "expirationDate": "20",
        "index": "2",
        "hash": "",
        "amount": "",
        "signer": "",
        "rootSignature": "",
        "root": ""
    },
    {
        "bid": [
            {
                "tt": "1",
                "collection": "0x136ac9A9D59cfB320C8Ad17f9fD37b4988c5528e",
                "id": "1",
                "amount": "1"
            }
        ],
        "ask": [
            {
                "tt": "1",
                "collection": "0x136ac9A9D59cfB320C8Ad17f9fD37b4988c5528e",
                "id": "1",
                "amount": "1"
            }
        ],
        "totalAmount": "5",
        "creationDate": "20",
        "expirationDate": "20",
        "index": "3",
        "hash": "",
        "amount": "",
        "signer": "",
        "rootSignature": "",
        "root": ""
    }
];
//     struct Asset {
//         TokenType tt;
//         address collection; // ERC721 or ERC1155 collection or ERC20 address
//         uint256 id;
//         uint256 amount;
//     }
//     struct MatchedOrder {
//         Asset[] bid;
//         Asset[] ask;
//         uint256 totalAmount;
//         uint256 amount;
//         bytes32 root;
//         bytes rootSignature;
//         address signer;
//         uint256 creationDate;
//         uint256 expirationDate;
//         uint256 index;
//         bytes32[] proof;
//         bytes32 hash;
//     }
describe("Marketplace", function () {
    // 	it("Should verify merkleproof and root signature", async function () {
    // 		const marketplaceBeneficiary = (await ethers.getSigners())[3];
    // 		const Marketplace = await ethers.getContractFactory("Marketplace");
    // 		const marketplace = await Marketplace.deploy(marketplaceBeneficiary.address);
    // 		await marketplace.deployed();
    // 		//            root
    // 		//          /     \
    // 		//        /         \
    // 		//    node1          node2
    // 		//     / \          /     \
    // 		//   h    h        h       h
    // 		//   |    |        |       |
    // 		//  leaf1 leaf2  leaf3   leaf4
    // 		const hasher = (x: any) => {
    // 			const encoded = utils.solidityPack(["address", "uint256", "address", "uint256", "uint256", "uint256"], [x.collectionAddress, x.nftId, x.currencyAddress, x.price, x.amount, x.nonce]);
    // 			return utils.keccak256(encoded);
    // 		}
    // 		const hashes = leaves.map(hasher);
    // 		let node1 = ethers.utils.keccak256(ethers.utils.concat([hashes[0], hashes[1]]));
    // 		let node2 = ethers.utils.keccak256(ethers.utils.concat([hashes[2], hashes[3]]));
    // 		let root = ethers.utils.keccak256(ethers.utils.concat([node1, node2]));
    // 		console.log(`\n
    //     tree:
    //                                                                                                               ${hashes[0]}
    //                                                 ${node1}
    //                                                                                                               ${hashes[1]}
    //     ${root}
    //                                                                                                               ${hashes[2]}
    //                                                 ${node2}
    //                                                                                                               ${hashes[3]}
    //     \n\n`)
    // 		const signer = (await ethers.getSigners())[0];
    // 		const signedRoot = await signer.signMessage(ethers.utils.arrayify(root));
    // 		await marketplace.verifyMerkleProof(
    // 			[
    // 				hashes[2],
    // 				node1
    // 			],
    // 			root,
    // 			3,
    // 			leaves[3].collectionAddress,
    // 			leaves[3].currencyAddress,
    // 			leaves[3].price,
    // 			leaves[3].amount,
    // 			leaves[3].nonce,
    // 			leaves[3].nftId,
    // 		);
    // 		await marketplace.verifyMerkleProof(
    // 			[
    // 				hashes[3],
    // 				node1
    // 			],
    // 			root,
    // 			2,
    // 			leaves[2].collectionAddress,
    // 			leaves[2].currencyAddress,
    // 			leaves[2].price,
    // 			leaves[2].amount,
    // 			leaves[2].nonce,
    // 			leaves[2].nftId,
    // 		);
    // 		await expect(marketplace.verifyMerkleProof(
    // 			[
    // 				hashes[2],
    // 				node1
    // 			],
    // 			root,
    // 			2,
    // 			leaves[2].collectionAddress,
    // 			leaves[2].currencyAddress,
    // 			leaves[2].price,
    // 			leaves[2].amount,
    // 			leaves[2].nonce,
    // 			leaves[2].nftId,
    // 		)).revertedWith("invalid proof");
    // 		const invalidRootSignature = await (await ethers.getSigners())[1].signMessage(root);
    // 		await marketplace.verifyRootSignature(root, signedRoot);
    // 		await expect(marketplace.verifyRootSignature(root, invalidRootSignature)).revertedWith("root is not signed by owner");
    // 	});
    it("Should calculate gas costs for all the calculations", async function () {
        const marketplaceBeneficiary = (await hardhat_1.ethers.getSigners())[3];
        const Marketplace = await hardhat_1.ethers.getContractFactory("Marketplace");
        const marketplace = await Marketplace.deploy(marketplaceBeneficiary.address);
        await marketplace.deployed();
        //            root
        //          /     \
        //        /         \
        //    node1          node2
        //     / \          /     \
        //   h    h        h       h
        //   |    |        |       |
        //  leaf1 leaf2  leaf3   leaf4
        const hasher = (x) => {
            let bidPacked = "";
            for (let i = 0; i < x.bid.length; i++) {
                const encoded = ethers_1.utils.solidityPack(["uint256", "address", "uint256", "uint256"], [x.bid[i].tt, x.bid[i].collection, x.bid[i].id, x.bid[i].amount]);
                bidPacked += encoded;
            }
            let askPacked = "";
            for (let i = 0; i < x.ask.length; i++) {
                const encoded = ethers_1.utils.solidityPack(["uint256", "address", "uint256", "uint256"], [x.ask[i].tt, x.ask[i].collection, x.ask[i].id, x.ask[i].amount]);
                askPacked += encoded;
            }
            const encoded = ethers_1.utils.solidityPack(["uint256", "uint256", "uint256", "uint256"], [x.totalAmount, x.creationDate, x.expirationDate, x.index]);
            return hardhat_1.ethers.utils.keccak256(hardhat_1.ethers.utils.concat([bidPacked, askPacked, encoded]));
        };
        const hashes = leaves.map(hasher);
        for (let h in hashes) {
            console.log(hashes[h]);
        }
        for (let i = 0; i < leaves.length; i++) {
        }
        // leaves[0].hash;
        // leaves[0].amount;
        // leaves[0].signer;
        // leaves[0].rootSignature;
        // leaves[0].root;
        // let node1 = ethers.utils.keccak256(ethers.utils.concat([hashes[0], hashes[1]]));
        // let node2 = ethers.utils.keccak256(ethers.utils.concat([hashes[2], hashes[3]]));
        // let root = ethers.utils.keccak256(ethers.utils.concat([node1, node2]));
        // 	console.log(`\n
        // 	    tree:
        // 	                                                                                                              ${hashes[0]}
        // 	                                                ${node1}
        // 	                                                                                                              ${hashes[1]}
        // 	    ${root}
        // 	                                                                                                              ${hashes[2]}
        // 	                                                ${node2}
        // 	                                                                                                              ${hashes[3]}
        // 	    \n\n`)
        // })
        const tree = createMerkleTreeFromLeavesHashes(hashes);
    });
});
function createMerkleTreeFromLeavesHashes(hashes) {
    var _a;
    let i = 0;
    let tree = [hashes];
    let upperLevel = [];
    while (i < hashes.length) {
        const left = hashes[i];
        const right = (_a = hashes[i + 1]) !== null && _a !== void 0 ? _a : "";
        const parent = hardhat_1.ethers.utils.keccak256(hardhat_1.ethers.utils.concat([left, right]));
        i += 2;
        upperLevel.push(parent);
        if (i >= hashes.length) {
            tree.push(upperLevel);
            hashes = upperLevel;
            i = 0;
            upperLevel = [];
        }
    }
    console.log("tree");
    for (let i = 0; i < tree.length; i++) {
        console.log(tree[i]);
    }
    return [[""]];
}
// let actualHashes = positions.map(getPositionHash);
//   while (actualHashes.length > 1) {
//     const newHashes: string[] = [];
//     for (let i = 0; i < actualHashes.length; i += 2) {
//       const hashesToConcat = [actualHashes[i], actualHashes[i + 1] ?? ''];
//       const hash = ethers.utils.keccak256(ethers.utils.concat(hashesToConcat));
//       newHashes.push(hash);
//     }
//     actualHashes = newHashes;
//   }
//   return actualHashes[0];
