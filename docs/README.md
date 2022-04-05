# Double Blind

Double Blind is an app for you to semi-anonymously sign messages for a group of
people. Each message can be verified as sent from **someone** in the group, but the
exact member cannot be identified (this is sometimes called a [group
signature](http://en.wikipedia.org/wiki/Group_signature)). These can be use for
anonymous feedback, forums, or many other semi-anonymous applications.

Double Blind uses public SSH keys to identify people, so groups are just a list
of public SSH keys. You can view public SSH keys from various places; for
example, you can view someone's GitHub keys at <https://github.com/stevenhao.keys>.

Currently, only RSA keys are supported.

## Registering your SSH identity
Before signing a message, you first need to have an SSH RSA keypair, e.g. `~/.ssh/id_rsa.pub`.
Rest assured, your SSH private key never leaves your machine. If you don't already have an SSH RSA keypair, you can generate a new one like so: 

```
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
```

Then, to prove you own the key, sign the message `E PLURIBUS UNUM; DO NOT SHARE`
and paste the output in the `Your Double Blind Key` box:
```
echo "E PLURIBUS UNUM; DO NOT SHARE" | ssh-keygen -Y sign -n double-blind.xyz -f ~/.ssh/id_rsa
```
DO NOT share this output with anyone; Double Blind uses it as your proof of
identity.

Treat your SSH Public key as your "username", and your Double Blind key (which is an SSH signature) as your "password". Anyone who has access to your Double Blind key will be able to construct signatures and revealers on your behalf.

## Signing Messages
After registering, you can begin the process of signing by filling in the message you'd like to sign, a group name to mark which group
you're signing for, and a list of SSH keys for the members of the group. You can
directly ask for SSH keys, or you can look them up on GitHub at
<https://github.com/ecnerwala.keys>. Only RSA keys are supported for now.

Now, sign the message using the `Sign` button and wait up to a minute for it to compute. Then, you can use the `Share Link` button next to the group
signature to get a sendable link with the group signature filled in. You can
also use the `Share Link` button next to the message to get a prefilled message,
if you'd like to share it with others to sign as well.

## Verifying Signatures

To verify a group signature, simply paste the group signature into the box on
the right hand side and click the `Verify` button. The Message, Group Name, and
Group Public Keys will be populated from the signature, but they may not be
truthful if the signature verification fails.

## Advanced Feature - Secret Identity

Double Blind supports an additional mode called `Secret Identity` which allows you to sign messages with
a randomly generated **masked signer identity**. (You can enable this with the
`Secret ID` toggle.) In the default mode, group signatures are completely
anonymous beyond group membership (though beware, two group signatures with
identical contents may be identical). With masked identities, you are still
anonymous, but two messages with the same masked identity must correspond to the
same public key.

When generating masked identities, you need to specify an **identity
namespace**. Multiple messages signed with the same namespace and same public
key will produce the same masked identity, so your namespaces should be unique,
long, random strings unless you're explicitly trying to link your messages.

Additionally, you can **reveal** your masked identity with an **identity
revealer**. This will link your masked identity to your true public key, so do
not share the identity revealer unless you'd like to deanonymize your messages.

Due to the nature of RSA signatures, in some cases, a malicious actor may
construct a tampered RSA private key which allows them to sign
two messages in the same identity namespace but with two **different** masked
identities. Thus, DO NOT rely on masked identity for determining unique
identities, e.g. for anonymous voting protocols. There is a planned protocol
extension which will allow users to prove they do not have a tampered public
key, which would make this safe.

## Underlying Concepts

### ZK Proofs

Double Blind is built using [Zero-Knowledge
Proofs](https://en.wikipedia.org/wiki/Zero-knowledge_proof) (ZK proofs). ZK
proofs are essentially signatures which require knowledge of a value satisfying
a specific function in order to generate correctly (so they prove knowledge of
the value); however, they do not reveal these values to any validator (so they
are zero-knowledge). Surprisingly, ZK proofs can be constructed for *any*
computable function.

For Double Blind, the function we care about is
```
RSA_verify(YOUR_PUBLIC_SSH_KEY, YOUR_DOUBLE_BLIND_KEY, "E PLURIBUS UNUM; DO NOT SHARE") && GROUP.contains(YOUR_PUBLIC_SSH_KEY)
```
A ZK proof of this statement shows that you own your public ssh key and are part
of the group, but does not reveal your public ssh key beyond that.

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

### RSA Public Key Tampering

It is theoretically possible for a malicious signer to generate an invalid RSA keypair that allows them to create multiple Double Blind keys corresponding to the same public RSA key. In particular, proper RSA keypair generation algorithms guarantee that an RSA public key (modulus n, exponent e) satisfies:
1. n = p * q is semiprime
2. e is relatively prime to p-1 and q-1

When these conditions are met, each (`message, public_key`) pairs maps to a unique signature, and nullifiers are unique as well. However, if the second condition is violated (i.e., if e is not relatively prime to p-1 and q-1), then the signature is non-unique. Thus, it is theoretically possible for malicious users to construct "tampered SSH keypairs" that would allow the user to produce multiple Double Blind Keys corresponding to a single public SSH key. This would allow them, e.g., multiple votes in an anonymous group voting system.

The Double Blind team is working on a tool that allows users to prove that their public key hasn't been tampered with. This scheme relies on the fact that a random message is unlikely to be signable by a tampered-with public key.

## Additional Reading

Github Repo for double-blind: https://github.com/doubleblind-xyz/double-blind

RSA: https://en.wikipedia.org/wiki/RSA_(cryptosystem)

Circuit Diagram: https://excalidraw.com/#json=prlRhzCaDe1HEmrabvXs4,LSAmJLJh5JDf38Xh2g3i4g

Circom: https://github.com/iden3/circom

SnarkJS: https://github.com/iden3/snarkjs

SSHSIG: https://github.com/openssh/openssh-portable/blob/master/PROTOCOL.sshsig, https://github.com/openssh/openssh-portable/blob/master/ssh-keygen.c

PKCS 1: https://datatracker.ietf.org/doc/html/rfc8017#section-9.2

## Related Work

https://semaphore.appliedzkp.org/

https://stealthdrop.xyz/

https://github.com/0xPARC/cabal