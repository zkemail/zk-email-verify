## DKIMRegistry.sol

The `DKIMRegistry.sol` is a Solidity contract that serves as a registry for storing the hash of the DomainKeys Identified Mail (DKIM) public key for each domain. This contract is part of the `@zk-email/contracts` package.

### Overview

The `DKIMRegistry` contract maintains a record of the DKIM key hashes for public domains. The hash is calculated by taking the Poseidon hash of the DKIM key split into 9 chunks of 242 bits each.

The contract provides methods to set and revoke DKIM public key hashes, and to check if a DKIM public key hash is valid. The contract also emits events when a DKIM public key hash is registered or revoked.

### Key Features

* **DKIM Public Key Hash Registration:** The `setDKIMPublicKeyHash` function allows the contract owner to register a new DKIM public key hash for a domain. The function emits a `DKIMPublicKeyHashRegistered` event upon successful registration.

* **DKIM Public Key Hash Revocation:** The `revokeDKIMPublicKeyHash` function allows the contract owner to revoke a DKIM public key hash. The function emits a `DKIMPublicKeyHashRevoked` event upon successful revocation.

* **DKIM Public Key Hash Validation:** The `isDKIMPublicKeyHashValid` function checks if a DKIM public key hash is valid for a given domain. It returns false if the hash has been revoked or if it does not exist for the domain.

* **Batch DKIM Public Key Hash Registration:** The `setDKIMPublicKeyHashes` function allows the contract owner to register multiple DKIM public key hashes for a domain at once.

### Security

The contract extends the `Ownable` contract from the OpenZeppelin contracts library, which provides basic access control mechanisms. Only the contract owner can register or revoke DKIM public key hashes.

### Usage

The `DKIMRegistry` contract is used in conjunction with the `EmailVerifier` circuit to verify emails. The `EmailVerifier` circuit checks the DKIM signature of an email against the DKIM public key hash stored in the `DKIMRegistry` contract for the email's domain.

For a more in-depth understanding, please visit our zk Email Verify repository at https://github.com/zkemail/zk-email-verify.
