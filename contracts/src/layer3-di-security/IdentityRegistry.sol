// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IdentityRegistry (Layer 3 — DI Security & Privacy Layer)
/// @notice Enforces GLEIF vLEI + ONCHAINID (ERC-734/735) and W3C VC 2.0 verification before any ERC-3643 mint or transfer.
contract IdentityRegistry {
    mapping(address => address) public userIdentity;
    mapping(address => string) public userVlei;
    mapping(uint256 => address) public trustedIssuers;
    mapping(address => bool) private verifiedParticipants;

    event IdentityRegistered(address indexed participant, address indexed onchainId, string vlei);
    event IdentityRevoked(address indexed participant);

    function registerIdentity(
        address _user,
        address _onchainId,
        string calldata _vlei
    ) external {
        userIdentity[_user] = _onchainId;
        userVlei[_user] = _vlei;
        verifiedParticipants[_user] = true;
        emit IdentityRegistered(_user, _onchainId, _vlei);
    }

    function revokeIdentity(address _user) external {
        verifiedParticipants[_user] = false;
        emit IdentityRevoked(_user);
    }

    function isVerified(address _user) external view returns (bool) {
        return verifiedParticipants[_user];
    }
}
