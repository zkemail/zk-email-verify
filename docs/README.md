# ZK Email Introduction

ZK Email is an app for you to anonymously verify email signatures yet mask whatever
data you would like. Each email can either be verified to be to/from specific domains
or subsets of domains, or have some specific text in the body. These can be used for
web2 interoperability, decentralized anonymous KYC, or interesting on-chain anonymity
sets.

For a deeper dive, read our full [blog post](https://blog.aayushg.com/posts/zkemail/).

## Sections

### [Installation](./zkEmailDocs/Installation/README.md)

Get started with zkEmail, install our SDKs so that you can build your own application.

### [Package Overviews](./zkEmailDocs/Package%20Overviews/README.md)
 Explore our npm sdk packages:
1. **zk-email/helpers**: Utility functions for generating proof inputs.
2. **zk-email/circuits**: Circuits for generating proofs and verifying DKIM signatures.
3. **zk-email/contracts**: Solidity contracts for email verification.


### [Usage Guide](./zkEmailDocs/UsageGuide/README.md)
This section provides a comprehensive guide on how to use the zkEmail packages. It covers everything from generating proof inputs, creating circuits for proofs, to verifying DKIM signatures.

It is recommended to go through this guide to understand how to effectively use the packages for email verification.




### Project Examples

Here you can find example projects that implement our SDKs:

1. **Twitter email verifier**: Prove you own a twitter username on chain. [Link to README](docs/twitterREADME.md)
2. **Email wallet**: Send money to anyone anonymously using email. [Email wallet Github](https://github.com/zkemail/email-wallet)
3. **ZKP2P**: ZKP2P is a trustless and privacy-preserving fiat-to-crypto onramp powered by ZK proofs [ZKP2P Github](https://github.com/zkp2p/zk-p2p)
4. **zkEmail Safe**: Operate Safe multisigs through email verified using ZK proofs [ zkEmail Safe Github](https://github.com/javiersuweijie/zkemail-safe)


## Terminology


- **DKIM**: DomainKeys Identified Mail. An email authentication method designed to detect email spoofing.
- **Zero-Knowledge Proofs**: A cryptographic method by which one party can prove to another that they know a value x, without conveying any information apart from the fact that they know the value x.
- **RSA**: Rivest–Shamir–Adleman. A public-key cryptosystem widely used for secure data transmission.
- **Circom**: A language for defining arithmetic circuits with a focus on zero-knowledge proofs.
- **SnarkJS**: A JavaScript library for zkSNARKs.
- **zkSNARKs**: Zero-Knowledge Succinct Non-Interactive Argument of Knowledge. A form of zero-knowledge proof that is particularly short and easy to verify.
- **Poseidon Hash**: A cryptographic hash function optimized for zk-SNARKs.
- **vkey**: A verification key used by the verifier to check the proof. Usually contained on the server side of an app.
- **zkey**: Proving key usually on the client side of an application.
- **witness**: In the context of zkSNARKs, a witness is the set of private inputs to the zkSNARK.
- **constraints**: Constraints are the conditions that the zkSNARK must satisfy. The proving time increases with additional constraints!
- **Regex**: Short for regular expression, this term represents sequence of characters that forms a search pattern, commonly used for string matching within text. In the context of zkEmail where it's used to parse email headers and extract relevant information.



## [FAQ](/README.md)
Check out our [FAQ](/README.md) for more questions!
<!-- ## Registering your email identity

If you wish to generate a ZK proof of Twitter badge, you must do these:

1. Send yourself a [password reset email](https://twitter.com/i/flow/password_reset) from Twitter in incognito.
2. In your inbox, find the email from Twitter and download headers (three dots, then download message).
3. Copy paste the entire contents of the file into the box below. We admit it is an unfortunate flow, but we are still searching for a good Twitter email that anyone can induce that cannot be injected.
4. Paste in your sending Ethereum address
5. Click "Generate Proof"

Note that it is completely client side and [open source](https://github.com/zk-email-verify/zk-email-verify/), and you are not trusting us with any private information.

## Verifying Signatures

To verify a group signature, simply paste the resulting proof on the right hand
side and click the `Verify` button. We will try to populate some signals.

## Advanced Understanding

Because you put your Ethereum address into the proof, it operates as a commitment
such that no one else can steal your proof on chain. If you in the future decide to
shift your Twitter badge to a new Ethereum address, you can do so by just generating a
proof like this again.

Because all web2 data is centralized to some extent, note that the Twitter mailserver
or database may know other identifying metadata about you just from your username.

Because we do not currently have a nullifier, email addresses can generate an infinite
number of password reset emails and thus Twitter badges corresponding to their username, meaning their credentials are safe if their Ethereum account is hijacked. This also means 'uniqueness' is hard to define,
so anonymous voting protocols in some anonymity set based on zk-email verification would not be possible.

The verification is slow due to large zkeys and proving time, things we are both working on
and starting new from-scratch implementations to fix.

There are several other theoretical issues like BCC's etc that break the claimed properties, so contact us or join [our discord](https://discord.gg/Sph38xHHNv) (has limited uses, [dm us](https://twitter.com/yush_g) for a new link) for more discussion.

### ZK Proofs

ZK proofs are essentially signatures which require knowledge of a value satisfying
a specific function in order to generate correctly (so they prove knowledge of
the value); however, they do not reveal these values to any validator (so they
are zero-knowledge). Surprisingly, ZK proofs can be constructed for _any_
computable function.

For ZK Email, the function we care about is

```
DKIM = RSA_verify(sha_hash(header | sha_hash(body)), pk)
```

A ZK proof of this statement shows that you own your public ssh key and are part
of the group, but does not reveal your public ssh key beyond that. The pk is on
the DNS record of the mail sending website.

In addition, for any fixed function, we can actually devise a scheme that
produces a very short proof: it is the same size irrespective of the
size/complexity of the function. Verification time is also constant; this
requires a precomputed short "verification key" which cryptographically encodes
the particular function. These **succinct** proofs are called zkSNARKs (Succinct
Non-interactive ARguments of Knowledge). zkSNARKs can be verified very quickly,
but signing (proving) a message still requires time proportional to the size of
the function.

### ZK Proof Construction

ZK proof protocols are generally specified as "arithmetic circuits" which
enforce particular constraints on the inputs. These circuits allow you to
constrain that two hidden "signals" add or multiply to another; signals can
correspond to provided inputs or can be computed intermediates. -->

## Additional Reading

Github Repo for double-blind: https://github.com/doubleblind-xyz/double-blind

RSA: https://en.wikipedia.org/wiki/RSA_(cryptosystem)

Talk: https://www.youtube.com/watch?v=sPCHiUT3TmA

Circom: https://github.com/iden3/circom

SnarkJS: https://github.com/iden3/snarkjs

## Tutorials
Circom Workshop 1: https://learn.0xparc.org/materials/circom/learning-group-1/circom-1

Circom Workshop 2: 
https://learn.0xparc.org/materials/circom/learning-group-1/circom-2

## Related Work

https://semaphore.appliedzkp.org/

https://stealthdrop.xyz/ + https://github.com/stealthdrop/stealthdrop

https://github.com/0xPARC/cabal

https://github.com/personaelabs/heyanon/
