// the numeric form of the payload1 passed into the primitive
// corresponds to the openssh signature produced by the following command:
// echo "E PLURIBUS UNUM; DO NOT SHARE" | ssh-keygen -Y sign -n double-blind.xyz -f ~/.ssh/id_rsa | pbcopy
export const MAGIC_DOUBLE_BLIND_BASE_MESSAGE =
  14447023197094784173331616578829287000074783130802912942914027114823662617007553911501158244718575362051758829289159984830457466395841150324770159971462582912755545324694933673046215187947905307019469n;
// Length in bits
export const MAGIC_DOUBLE_BLIND_BASE_MESSAGE_LEN = 672;

export const CIRCOM_FIELD_MODULUS =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;
// circom constants from main.circom / https://zkrepl.dev/?gist=30d21c7a7285b1b14f608325f172417b
// template RSAGroupSigVerify(n, k, levels) {
// component main { public [ modulus ] } = RSAVerify(121, 17);
// component main { public [ root, payload1 ] } = RSAGroupSigVerify(121, 17, 30);
export const CIRCOM_BIGINT_N = 121;
export const CIRCOM_BIGINT_K = 34;
export const CIRCOM_LEVELS = 30;
