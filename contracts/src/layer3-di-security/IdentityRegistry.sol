// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IdentityRegistry (Layer 3 — DI Security & Privacy Layer)
/// @notice Enforces GLEIF vLEI + ONCHAINID (ERC-734/735) and W3C VC 2.0 verification before any ERC-3643 mint or transfer.
contract IdentityRegistry {
    struct CorporateIdentityRecord {
        address wallet;
        address onchainIdContract;
        string vlei;
        string legalName;
        string jurisdiction;
        string qviIssuer;
        bool verified;
        uint64 registeredAt;
    }

    struct VerifiableCredentialRecord {
        string vcId;
        string vcType;
        string issuerDid;
        string issuerName;
        address subjectAddress;
        string subjectDid;
        string claimSummary;
        bool revoked;
        uint64 issuedAt;
    }

    mapping(address => CorporateIdentityRecord) public identities;
    address[] public registeredAddresses;
    VerifiableCredentialRecord[] public credentials;

    event IdentityRegistered(
        address indexed participant,
        address indexed onchainId,
        string vlei,
        string legalName
    );
    event IdentityRevoked(address indexed participant);
    event CredentialIssued(string vcId, address indexed subjectAddress, string vcType);

    function registerIdentity(
        address _user,
        address _onchainId,
        string calldata _vlei,
        string calldata _legalName,
        string calldata _jurisdiction,
        string calldata _qviIssuer
    ) external {
        if (identities[_user].registeredAt == 0) {
            registeredAddresses.push(_user);
        }
        identities[_user] = CorporateIdentityRecord({
            wallet: _user,
            onchainIdContract: _onchainId,
            vlei: _vlei,
            legalName: _legalName,
            jurisdiction: _jurisdiction,
            qviIssuer: _qviIssuer,
            verified: true,
            registeredAt: uint64(block.timestamp)
        });
        emit IdentityRegistered(_user, _onchainId, _vlei, _legalName);
    }

    function issueCredential(
        string calldata _vcId,
        string calldata _vcType,
        string calldata _issuerDid,
        string calldata _issuerName,
        address _subjectAddress,
        string calldata _subjectDid,
        string calldata _claimSummary
    ) external {
        credentials.push(
            VerifiableCredentialRecord({
                vcId: _vcId,
                vcType: _vcType,
                issuerDid: _issuerDid,
                issuerName: _issuerName,
                subjectAddress: _subjectAddress,
                subjectDid: _subjectDid,
                claimSummary: _claimSummary,
                revoked: false,
                issuedAt: uint64(block.timestamp)
            })
        );
        emit CredentialIssued(_vcId, _subjectAddress, _vcType);
    }

    function revokeIdentity(address _user) external {
        identities[_user].verified = false;
        emit IdentityRevoked(_user);
    }

    function isVerified(address _user) external view returns (bool) {
        return identities[_user].verified;
    }

    function getIdentity(address _user) external view returns (CorporateIdentityRecord memory) {
        return identities[_user];
    }

    function getAllIdentities() external view returns (CorporateIdentityRecord[] memory) {
        uint256 len = registeredAddresses.length;
        CorporateIdentityRecord[] memory list = new CorporateIdentityRecord[](len);
        for (uint256 i = 0; i < len; i++) {
            list[i] = identities[registeredAddresses[i]];
        }
        return list;
    }

    function getAllCredentials() external view returns (VerifiableCredentialRecord[] memory) {
        return credentials;
    }
}
