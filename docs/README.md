# ZK Email

ZK Email is an app for you to anonymously verifiy email signatures yet mask whatever
data you would like. Each email can either be verified to be to/from specific domains
or subsets of domains, or have some specific text in the body. These can be used for
web2 interoperability, decentralized anonymous KYC, or interesting on-chain anonymity
sets. For a deeper dive, read our full [blog post](https://blog.aayushg.com/posts/zkemail/).

## Registering your email identity

If you wish to generate a ZK proof of Twitter badge, you must do these:

1. Send yourself a password reset email from Twitter in incognito.
2. In your inbox, find the email from Twitter and download headers (three dots, then download message).
3. Copy paste the entire contents of the file into the box below
4. Paste in your sending Ethereum key
5. Click "Generate Proof"

Note that it is completely client side and [open source](https://github.com/zk-email-verify/zk-email-verify/), and you are not trusting us with any private information.

## Verifying Signatures

To verify a group signature, simply paste the resulting proof on the right hand
side and click the `Verify` button. We will try to populate some signals.

## Advanced Understanding

Because you put your Ethereum key into the proof, it operates as a commitment
such that no one else can steal your proof on chain. If you in the future decide to
shift your Twitter badge to a new Ethereum address, you can do so by just generating a
proof like this again.

Because all web2 data is centralized to some extent, note that the Twitter mailserver
or database may know other identifying metadata about you just from your username.

Becaause we do not currently have a nullifier, email addresses can generate an infinite
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
correspond to provided inputs or can be computed intermediates.

## Additional Reading

Github Repo for double-blind: https://github.com/doubleblind-xyz/double-blind

RSA: https://en.wikipedia.org/wiki/RSA_(cryptosystem)

Talk: https://www.youtube.com/watch?v=sPCHiUT3TmA

Circom: https://github.com/iden3/circom

SnarkJS: https://github.com/iden3/snarkjs

## Related Work

https://semaphore.appliedzkp.org/

https://stealthdrop.xyz/ + https://github.com/stealthdrop/stealthdrop

https://github.com/0xPARC/cabal

https://github.com/personaelabs/heyanon/
