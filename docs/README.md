# Double Blind

Double Blind is a way for a group of people to semi-anonymously broadcast
messages; each message can be verified as sent from **someone** in the group,
but the members themselves cannot be identified (this is sometimes called a
[group signature](http://en.wikipedia.org/wiki/Group_signature)).

Double Blind uses public SSH keys to identify people, so groups are just a list
of public SSH keys. You can view public SSH keys from various places; for
example, you can view someone's GitHub keys at
<https://github.com/{username}.keys>.

Currently, only RSA keys are supported.

## Signing Messages

To sign a message, you first need to have an SSH RSA key, e.g. `~/.ssh/id_rsa`.
(Rest assured, your SSH private key never leaves your machine.) To generate a
new one, use
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

Then, fill in the message you'd like to sign, a group name to mark which group
you're signing for, and a list of SSH keys for the members of the group. You can
directly ask for SSH keys, or you can look them up on GitHub at
<https://github.com/{username}.keys>. Only RSA keys are supported right now, so
only include those.

Now, sign the message using the `Sign` button. This process might take
a little bit. Then, you can use the `Share Link` button next to the group
signature to get a sendable link with the group signature filled in. You can
also use the `Share Link` button next to the message to get a prefilled message,
if you'd like to share it with others to sign as well.

## Verifying Signatures

To verify a group signature, simply paste the group signature into the box on
the right hand side and click the `Verify` button. The Message, Group Name, and
Group Public Keys will be populated from the signature, but they may not be
truthful if the signature verification fails.

## Advanced Feature - Signer IDs

In the default mode, group signatures are completely anonymous beyond group
membership (though beware, two group signatures with identical contents may be
identical). However, Double Blind supports an additional feature that allows you
to sign a message with a secret "masked identity". The masked identity is
randomly generated and anonymous, but two messages with the same masked identity
correspond to the same public key.

Additionally, you can **reveal** your masked identity with an 

## Concepts
