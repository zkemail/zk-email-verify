import _ from "lodash";

export interface IInput {
  /** 
   * Plaintext string starting with -----BEGIN SSH SIGNATURE-----
   * Output of following command (run locally by the end user):
   *      echo "E PLURIBUS UNUM; DO NOT SHARE" | ssh-keygen -Y sign -n
   *      doubleblind.xyz -f ~/.ssh/id_rsa
  */
  sshSignature: string;
  /**
   * Plaintext string message that, combined with sshSignature, determines the group signature nullifier
   */
  payload1: string;
  /**
   * Plaintext string message. Different from payload1 only in that it does not factor into nullifier
   */
  payload2: string;
  /**
   * If set to false, groupSig.publicSignals.nullifier will always be 0.
   * Otherwise, it will be Poseidon(PoseidonK(pubKey), opener), where opener = Poseidon(payload1, PoseidonK(priv)
   * Practically, nullifier equalling 0 means that 
   */
  useNullifier: boolean;
  groupKeys: string[];
}

export interface IGroupSignature {
  payload1: string;
  payload2: string;
  groupKeys: string[];
  proof: string;
  nullifier: string;
}

export const isGroupSignature = (o: object): o is IGroupSignature => {
return _.every(['payload1', 'payload2', 'groupKeys', 'proof', 'nullifier'].map(k => k in o));
}