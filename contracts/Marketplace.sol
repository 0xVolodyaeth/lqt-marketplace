// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "./IGetRoyalties.sol";

contract Marketplace is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    enum ItemType {
        Native,
        ERC20,
        ERC721,
        ERC1155
    }

    enum OrderType {
        SWAP,
        BUNDLE_OR_NFT_TO_CURRENCY_OR_NATIVE,
        OFFER_TO_CURRENCY_OR_MULTIPLE_CURRENCY
    }

    struct MarketplaceFee {
        bool customFee;
        uint16 buyerFee;
        uint16 sellerFee;
    }

    struct CollectionRoyalties {
        address recipient;
        uint256 fee;
    }

    struct Asset {
        ItemType itemType;
        address collection; // ERC721 or ERC1155 collection or ERC20 address
        uint256 id;
        uint256 amount;
    }

    struct MatchedOrder {
        Asset[] bid;
        Asset[] ask;
        uint256 totalAmount;
        uint256 amount;
        bytes32 root;
        bytes rootSignature;
        address payable signer; // signs bid array
        uint256 creationDate;
        uint256 expirationDate;
        bytes32[] proof;
        bool askAny;
        bool bidAny;
        OrderType orderType;
    }

    /**
     * @dev Emitted when position is bought
     */
    event Buy(
        address from,
        address to,
        address indexed collection,
        uint256 indexed tokenId,
        uint256 amount
    );

    /**
     * @dev Emitted when changing `MarketplaceFee` for an `colection`.
     */
    event MarketplaceFeeChanged(
        address indexed colection,
        uint16 buyerFee,
        uint16 sellerFee
    );

    /**
     * @dev Emitted when changing `customCollectionRoyalties` for an `colection`.
     */
    event CollectionRoyaltiesChanged(
        address indexed colection,
        address recipient,
        uint256 indexed amount
    );

    bytes4 private iGetRoyaltiesInterfaceId;
    address public feesBeneficiary;

    mapping(address => bool) private operators;
    mapping(address => MarketplaceFee) private marketplaceCollectionFee;
    mapping(address => CollectionRoyalties) private customCollectionRoyalties;
    mapping(bytes32 => uint256) private matchedOrderHashToNonce;

    constructor(address _feesBeneficiary) {
        iGetRoyaltiesInterfaceId = type(IGetRoyalties).interfaceId;
        feesBeneficiary = _feesBeneficiary;
        operators[_msgSender()] = true;
        marketplaceCollectionFee[address(0)] = MarketplaceFee(true, 250, 250);
    }

    modifier isOperator() {
        require(operators[_msgSender()], "address is not an operator");
        _;
    }

    /**
     * @param matchedOrder list of positions to buy
     * @param txExpirationDate expiration date
     * @param orderSignByBack positions signer by backend
     * @param hashes list of position hashes
     */
    function buy(
        MatchedOrder[] calldata matchedOrder,
        uint256 txExpirationDate,
        bytes calldata orderSignByBack,
        bytes32[] calldata hashes
    ) external payable nonReentrant {
        require(txExpirationDate > block.timestamp, "Order: order is expired");

        // verify order signature
        {
            uint256 chainId;
            assembly {
                chainId := chainid()
            }

            require(
                operators[
                    ethSignedMessageRecover(
                        keccak256(
                            abi.encode(
                                txExpirationDate,
                                address(this),
                                chainId,
                                hashes
                            )
                        ),
                        orderSignByBack
                    )
                ],
                "Order: order is not signed by backend"
            );
        }

        for (uint256 i = 0; i < matchedOrder.length; ) {
            require(
                matchedOrder[i].totalAmount >
                    matchedOrderHashToNonce[hashes[i]],
                "Order: position is bought"
            );

            // verify root signature
            {
                address recovered = matchedOrder[i]
                    .root
                    .toEthSignedMessageHash()
                    .recover(matchedOrder[i].rootSignature);
                require(
                    matchedOrder[i].signer == recovered,
                    "Order: root is not signed by collection owner"
                );
            }

            bytes32 restoredHash = hashOrder(matchedOrder[i]);
            require(restoredHash == hashes[i], "Order: hashes do not match");

            require(
                restoreRoot(matchedOrder[i].proof, restoredHash) ==
                    matchedOrder[i].root,
                "Order: invalid proof"
            );

            matchedOrderHashToNonce[hashes[i]] += matchedOrder[i].amount;

            if (matchedOrder[i].orderType == OrderType.SWAP) {
                swapAssets(
                    matchedOrder[i].ask,
                    matchedOrder[i].bid,
                    matchedOrder[i].signer
                );
            } else if (
                matchedOrder[i].orderType ==
                OrderType.BUNDLE_OR_NFT_TO_CURRENCY_OR_NATIVE
            ) {
                swapOrOfferForNativeOrCurrency(
                    matchedOrder[i].ask,
                    matchedOrder[i].bid,
                    matchedOrder[i].signer,
                    _msgSender()
                );
            } else if (
                matchedOrder[i].orderType ==
                OrderType.OFFER_TO_CURRENCY_OR_MULTIPLE_CURRENCY
            ) {
                swapOrOfferForNativeOrCurrency(
                    matchedOrder[i].bid,
                    matchedOrder[i].ask,
                    _msgSender(),
                    matchedOrder[i].signer
                );
            }

            unchecked {
                ++i;
            }
        }
    }

    /**
     * @notice swapOrOfferForNativeOrCurrency transfer assets with getting fees
     * @param _ask list of assets that signer listed
     * @param _bid list of assets which will be paid to signer
     * @param _askRecipient _askRecipient
     * @param _bidRecipient _bidRecipient
     */
    function swapOrOfferForNativeOrCurrency(
        Asset[] calldata _ask,
        Asset[] calldata _bid,
        address _askRecipient,
        address _bidRecipient
    ) internal {
        uint256 i = 0;
        for (; i < _ask.length; ) {
            transferPaymentAndFees(
                _bidRecipient,
                _askRecipient,
                _ask[i].collection,
                _ask[i].amount,
                _bid[0].collection
            );

            unchecked {
                ++i;
            }
        }

        for (i = 0; i < _bid.length; ) {
            transferAsset(
                _askRecipient,
                _bidRecipient,
                _bid[i].collection,
                _bid[i].id,
                _bid[i].amount,
                _bid[i].itemType
            );

            unchecked {
                ++i;
            }
        }
    }

    /**
     * @notice swapAssets transfer assets without getting fees
     * @param _ask list of assets that signer listed
     * @param _bid list of assets which will be paid to signer
     * @param _signer signer who listed his positions
     */
    function swapAssets(
        Asset[] calldata _ask,
        Asset[] calldata _bid,
        address _signer
    ) internal {
        uint256 i = 0;
        for (; i < _bid.length; ) {
            transferAsset(
                _signer,
                _msgSender(),
                _bid[i].collection,
                _bid[i].id,
                _bid[i].amount,
                _bid[i].itemType
            );

            unchecked {
                ++i;
            }
        }

        for (i = 0; i < _ask.length; ) {
            transferAsset(
                _msgSender(),
                _signer,
                _ask[i].collection,
                _ask[i].id,
                _ask[i].amount,
                _ask[i].itemType
            );

            unchecked {
                ++i;
            }
        }
    }

    /**
     * @param _from address from which fees and payment is taken
     * @param _to address who receives payment
     * @param _currency token address
     * @param _amount amount of tokens
     * @param _collectionToTakeFeesFor collection wich is used to take fees
     */
    function transferPaymentAndFees(
        address _from,
        address _to,
        address _currency,
        uint256 _amount,
        address _collectionToTakeFeesFor
    ) internal {
        // 1. marketplace fees
        {
            MarketplaceFee memory marketplaceFee = getMarketplaceFee(
                // all tokens within a collection have the
                // same royalties, so use the first position in _bid
                _collectionToTakeFeesFor
            );
            uint256 buyerFee = calculateFee(_amount, marketplaceFee.buyerFee);
            uint256 sellerFee = calculateFee(_amount, marketplaceFee.sellerFee);

            if (buyerFee + sellerFee > 0) {
                transfer(
                    _from,
                    feesBeneficiary,
                    _currency,
                    buyerFee + sellerFee
                );
            }
        }

        // 2. royalties
        {
            uint256 royalty;
            CollectionRoyalties
                memory collectionRoyalties = getCustomCollectionRoyalties(
                    _collectionToTakeFeesFor
                );

            if (collectionRoyalties.fee > 0) {
                royalty = calculateFee(_amount, collectionRoyalties.fee);

                transfer(
                    _from,
                    collectionRoyalties.recipient,
                    _currency,
                    royalty
                );
            }
        }

        // 3. payment
        transfer(_from, _to, _currency, _amount);
    }

    /**
     * @param _from address from which fees and payment is taken
     * @param _to address who receives payment
     * @param _currency token address, if payment is performend in native coin then address(0) can be used
     * @param _amount amount of tokens
     */
    function transfer(
        address _from,
        address _to,
        address _currency,
        uint256 _amount
    ) internal {
        bool sent;
        if (_currency == address(0)) {
            (sent, ) = payable(_to).call{value: _amount}("");
        } else {
            sent = IERC20(_currency).transferFrom(_from, _to, _amount);
        }

        require(sent, "Failed to send");
    }

    /**
     * @param _from address from which fees and payment is taken
     * @param _to address who receives payment
     * @param _collection collection or token address in case of ERC20
     * @param _id id
     * @param _amount amount of tokens only applied if _it is ERC1155 or ERC20
     * @param _it itemType
     */
    function transferAsset(
        address _from,
        address _to,
        address _collection,
        uint256 _id,
        uint256 _amount,
        ItemType _it
    ) internal {
        if (_it == ItemType.ERC721) {
            IERC721(_collection).safeTransferFrom(_from, _to, _id);
        } else if (_it == ItemType.ERC1155) {
            IERC1155(_collection).safeTransferFrom(
                _from,
                _to,
                _id,
                _amount,
                ""
            );
        } else if (_it == ItemType.ERC20) {
            transfer(_from, _to, _collection, _amount);
        }

        emit Buy(_from, _to, _collection, _id, _amount);
    }

    /**
     * @dev used to calculate royalty fees and marketplace fees
     */
    function calculateFee(uint256 _amount, uint256 _fee)
        internal
        pure
        returns (uint256)
    {
        return (_amount * _fee) / 10000;
    }

    /**
     * @dev used to verify merkle tree proof
     * @param _proof merkle treee proof
     * @param _restoredHash hash of matchedOrder
     */
    function restoreRoot(bytes32[] calldata _proof, bytes32 _restoredHash)
        internal
        pure
        returns (bytes32)
    {
        for (uint256 i = 0; i < _proof.length; i++) {
            bytes32 proofElement = _proof[i];

            if (_restoredHash <= proofElement) {
                _restoredHash = keccak256(
                    abi.encodePacked(_restoredHash, proofElement)
                );
            } else {
                _restoredHash = keccak256(
                    abi.encodePacked(proofElement, _restoredHash)
                );
            }
        }

        return _restoredHash;
    }

    /**
     * @dev hashOrder
     */
    function hashOrder(MatchedOrder calldata _matchedOrder)
        internal
        pure
        returns (bytes32)
    {
        if (_matchedOrder.askAny && _matchedOrder.ask.length == 1) {
            return
                keccak256(
                    abi.encode(
                        _matchedOrder.bid,
                        _matchedOrder.ask[0].itemType,
                        _matchedOrder.ask[0].collection,
                        _matchedOrder.ask[0].amount,
                        _matchedOrder.totalAmount,
                        _matchedOrder.creationDate,
                        _matchedOrder.expirationDate
                    )
                );
        }

        if (_matchedOrder.bidAny && _matchedOrder.bid.length == 1) {
            return
                keccak256(
                    abi.encode(
                        _matchedOrder.bid[0].itemType,
                        _matchedOrder.bid[0].collection,
                        _matchedOrder.bid[0].amount,
                        _matchedOrder.ask,
                        _matchedOrder.totalAmount,
                        _matchedOrder.creationDate,
                        _matchedOrder.expirationDate
                    )
                );
        }

        return
            keccak256(
                abi.encode(
                    _matchedOrder.bid,
                    _matchedOrder.ask,
                    _matchedOrder.totalAmount,
                    _matchedOrder.creationDate,
                    _matchedOrder.expirationDate
                )
            );
    }

    /**
     * @dev changeFeesBeneficiary
     */
    function changeFeesBeneficiary(address _feesBeneficiary)
        external
        isOperator
    {
        feesBeneficiary = _feesBeneficiary;
    }

    /**
     * @dev getCustomCollectionRoyalties
     */
    function getCustomCollectionRoyalties(address _collection)
        internal
        view
        returns (CollectionRoyalties memory)
    {
        return customCollectionRoyalties[_collection];
    }

    /**
     * @dev getMarketplaceFee(
     */
    function getMarketplaceFee(address _collection)
        internal
        view
        returns (MarketplaceFee memory)
    {
        if (marketplaceCollectionFee[_collection].customFee) {
            return marketplaceCollectionFee[_collection];
        }
        return marketplaceCollectionFee[address(0)];
    }

    /**
     * @dev changeMarketplaceCollectionFee
     */
    function changeMarketplaceCollectionFee(
        address _collection,
        uint16 _buyerFee,
        uint16 _sellerFee
    ) external isOperator {
        require(_sellerFee > 0 && _sellerFee < 10000, "Wrong amount");
        require(_buyerFee > 0 && _buyerFee < 10000, "Wrong amount");

        marketplaceCollectionFee[_collection] = MarketplaceFee(
            true,
            _buyerFee,
            _sellerFee
        );
        emit MarketplaceFeeChanged(_collection, _buyerFee, _sellerFee);
    }

    /**
     * @dev removeMarketplaceCollectionFee
     */
    function removeMarketplaceCollectionFee(address _collection)
        external
        isOperator
    {
        require(_collection != address(0), "Wrong collection");
        delete marketplaceCollectionFee[_collection];
        emit MarketplaceFeeChanged(
            _collection,
            marketplaceCollectionFee[address(0)].buyerFee,
            marketplaceCollectionFee[address(0)].sellerFee
        );
    }

    /**
     * @dev changeCollectionRoyalties
     */
    function changeCollectionRoyalties(
        address _collection,
        address _recipient,
        uint256 _amount
    ) external isOperator {
        require(_collection != address(0), "Wrong collection");
        require(_amount > 0 && _amount < 10000, "Wrong amount");
        customCollectionRoyalties[_collection] = CollectionRoyalties(
            _recipient,
            _amount
        );
        emit CollectionRoyaltiesChanged(_collection, _recipient, _amount);
    }

    /**
     * @dev removeCollectionRoyalties
     */
    function removeCollectionRoyalties(address _collection)
        external
        isOperator
    {
        delete customCollectionRoyalties[_collection];
        emit CollectionRoyaltiesChanged(_collection, address(0), 0);
    }

    /**
     * @dev setOperator
     */
    function setOperator(address _operator) external isOperator {
        operators[_operator] = true;
    }

    function ethSignedMessageRecover(bytes32 _hash, bytes calldata _signature)
        internal
        pure
        returns (address)
    {
        return _hash.toEthSignedMessageHash().recover(_signature);
    }
}
