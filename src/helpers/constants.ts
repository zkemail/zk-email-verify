// the numeric form of the payload1 passed into the primitive
// corresponds to the openssh signature produced by the following command:
// echo "E PLURIBUS UNUM; DO NOT SHARE" | ssh-keygen -Y sign -n do_not_share_this_signature@doubleblind.xyz -f ~/.ssh/id_rsa  | pbcopy
export const MAGIC_DOUBLE_BLIND_BASE_MESSAGE_HEX = "003051300d0609608648016503040203050004403710c692cc2c46207b0c6f9369e709afe9fcdbe1f7097370c1fc7a55aeef8dd0aa9d0a084526dbe59eb24eee4a5320c1f053def2e404c5b45ade44f9b56143e9";
// regex
export const MAGIC_DOUBLE_BLIND_REGEX = new RegExp(
  `^1(ff)+${MAGIC_DOUBLE_BLIND_BASE_MESSAGE_HEX}$`
);
export const CIRCOM_FIELD_MODULUS = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
// circom constants from main.circom / https://zkrepl.dev/?gist=30d21c7a7285b1b14f608325f172417b
// template RSAGroupSigVerify(n, k, levels) {
// component main { public [ modulus ] } = RSAVerify(121, 17);
// component main { public [ root, payload1 ] } = RSAGroupSigVerify(121, 17, 30);
export const CIRCOM_BIGINT_N = 121;
export const CIRCOM_BIGINT_K = 34;
export const CIRCOM_LEVELS = 30;
