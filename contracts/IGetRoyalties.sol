//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

interface IGetRoyalties {
    struct Fee {
        address payable recipient;
        uint256 value;
    }

    function getFeeRecipients(uint256 _id)
        external
        view
        returns (address payable[] memory);

    function getFeeBps(uint256 _id) external view returns (uint256[] memory);

    function getRoyalties(uint256 _id)
        external
        view
        returns (address payable[] memory, uint256[] memory);

    function setFees(uint256 _tokenId, Fee[] memory _fees) external;

    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}
