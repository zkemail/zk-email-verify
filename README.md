# Welcome to ZK-Email

<p align="center">
  <img src="docs/logo.jpg" width="300">
</p>

ZK Email is an application that allows for anonymous verification of email signatures while masking specific data. It enables verification of emails to/from specific domains or subsets of domains, as well as verification based on specific text in the email body. Our core SDK comes with libraries to assist with circuit generation as well as utility templates for general zk applications.


## Packages Overview

The ZK Email Verifier is built on three core packages:

### @zk-email/helpers
Provides utility functions for email verification and cryptographic operations, including RSA signatures, public keys, email bodies, and hashes. [Read more](/packages/helpers/README.md).

### @zk-email/circuits
Offers pre-built circuits for proof generation and DKIM signature verification. [Read more](/packages/circuits/README.md).

### @zk-email/contracts
Contains Solidity contracts for email verification purposes. [Read more](/packages/contracts/README.md).

## Demo

[Proof of Twitter](https://github.com/zkemail/proof-of-twitter/) is a demo application built using ZK-Email where you can prove ownership of a Twitter account (and mint an NFT) using an email from Twitter.

Try here: [https://twitter.prove.email/](https://twitter.prove.email/)

You can fork the project as a starting point for your own ZK-Email application.

Moreover, for those interested in creating the Twitter circuit from scratch, our [Proof of Twitter guide](https://prove.email/blog/twitter) offers a step-by-step tutorial on utilizing our SDKs for circuit construction.

## Audits

  - Audit from [zkSecurity](https://zksecurity.xyz/) that cover both `zk-email-verify` and `zk-regex` - [Report](/audits/zksecurity-audit.pdf). Version [`6.1.0`](https://github.com/zkemail/zk-email-verify/releases/tag/v6.1.0) fixes the issues found in the audit.

  - Audit from [yAcademy](https://yacademy.dev/) - [Report](/audits/yacademy-audit.pdf).



## Contributors 💡
For each pull request that successfully merges and addresses an [open issue](https://github.com/zkemail/zk-email-verify/issues), we offer a $50 reward. Should we overlook issuing your reward, kindly send us a direct message as a reminder. To learn more about how you can contribute to this project, please consult our [Contributing Guide](Contributing.md).

A heartfelt thank you goes to all of our contributors!


## Licensing
Everything we write is MIT-licensed. Note that circom and circomlib is GPL. Broadly we are pro permissive open source usage with attribution! We hope that those who derive profit from this, contribute that money altruistically back to this technology and open source public goods.
