import { useState } from "react";

import { buildPoseidon } from "circomlibjs";

const STEVEN_KEYS = JSON.parse("[{\"id\":35722596,\"key\":\"ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDcJSRy+RXANfCgJpzhX9fWEnslgCcgffw5t2mWW5Ltc2cfiWr1w3dUGoSa6oNs1QTwYkdfvy9cv1zwG+77a1AhtmjwywahSuOE3yg1IIe6Qo4U7Ae+7r8F08Qob7Ct8ZoUHPupbFYyXF759xYpN+vvjuy3MbgTwnbijqH2HUAIwBT2V/xbGuwVBNK80i9ib3DNchW/wYu9oSukXufzBpPYBZUzAcejCTjPuv3ts/L+VPJSgaiHeZ/qlzU01BQ37dbEieDI6k64IKNppW2l+C0ERGtsKjPSINC+x+OvS7puOtI+Au+p72soaBIrfONsL3oTUgtj82bRzVALCM1Dxh+K7O0i00H/5xICB4+b/GRgho+F4IlDf2mDy9qMoyNA8vemH/LC9Rc+ujzIJJHD9WL8nDvg2v8lQGtWDrSlwjRKlp7MtVad+COF6K9oCXjhFWUVirvG/1cG/Ynmzn9/2ZEdsYuqL6TEflxtuIM2YdJWIubgnINs3l8P8UwuNa/UoM4leBT05LP+xbD7+HWSXNuWK9+7d3t03qOoGdfsbonk9wolM5l04QlTI+lOmQObBxHBT7CH4cwWC/evovPK9jKkAk/AC68YTWAV1U43O9gKmtq67TsShJ9YOeZU6xAp7kAcFVjpABz6suhQa6vGrGCKO8ERp4rLV9KUrgJin86KzQ==\"},{\"id\":45187090,\"key\":\"ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDBN+ISLXgsf3xxG18ZSKAwARj/0mw0x8JGQoWuCcDB5C99bgC5CMIsm/7ZYHye6BdB7GbY3RV/aVuLzm2lh2Q9opPT2AJhWDdeYyLhrIRsexNfnUXZsETxI4M7P5mZXNHAVASG/Q/gu2lb1aPt5oOiRCI7tvitKLOGrUtb0/KToaityX2OJFmEnmH+RM6t2ICwmfObterWjzm+J5k1ydFjSSwkx669U/GWVf56Rruburz/XlDwUm9liVef5iTOH8/rSu82ejamZXoYJFCaSq3nCZRw8mb6xs+zoiYcKiGozlhg6Zbpkexr4i20vPR5d9rQItaZ38cmbk2HwZzpaqUx/t055CpmUQ2N/vfvzr3rUCeG0SkWsew0m8UDB0AU6LYKCQS50kr0KBYEtE+lt46iLf+5XrlBhFj99xqx5qOeSY9Pz8xuu3Ti2ckDKhyMTj9uONSBPVOxRslX8PK35L0lQdM8TOjKBpVAWx4Fyag93QWyPFdUD4kB+HHSo9FgC9vZxtoxPOpTf8GgIzspGVHL+MjW7QmBs+cD48K9k6XMmaSq1AEx1JjeysoO5d9bzTygyHAhyZtZftnaTQ6r8OjUGL+U9J16Ezp1CwxY8tHpIyh2e6HUuVE8CNkeKLf6j2VIgdQd7b+iSPtr3bc43tMYRW9576Qov/t8pP8gEla83w==\"},{\"id\":50122622,\"key\":\"ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJ2l7Z1BmwWww0wusInNJKCG9BHFveaHGJQQdaNGUE32\"}]");

const ANDREW_KEYS = JSON.parse("[{\"id\":32492856,\"key\":\"ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOCvKnd7nrY69EPIn0FU+mJDU2jxW1jDfxEuMXzj6j+W\"},{\"id\":64248459,\"key\":\"ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDRvpOL7TZcYtHsSSz4lj8vTyIEuFSQnUqHTxhhsEWzAbq9LHMqYm4Whg1oRm430QvJF5xfOaLk+bmO6hN1g4Y9yJUj4uhaNSfSl3wGLBxu5OQNngnIDCbxTLjat4Jgz79ZiAo79c6bVq13xcfG0fjtFoC3FbZD0VEmqmwd/lYCLLVqtjccQur8B56O9Pj/giDMby0iQPFEe9vlpP8Wg3WVjFRQkwNOhGzvLNrlOBkJXpG9xty43O9T09qHJzKYobrAnlKeRTqYqppVfwmYI7rqr2rqTXF9mBB4s1zUCXJzTVrnqexzeH+Uv54KIaXxR2CAn3+DDtDBfJ4wqk/8OBNN\"}]");

function get_org_users(org) {
}

function get_user_keys(user) {
  if (user === "ecnerwala") {
    return ANDREW_KEYS;
  } else if (user === "stevenhao") {
    return STEVEN_KEYS;
  } else {
    // TODO: Github API
    return [];
  }
}

export default function Merkle() {
  const users = ["ecnerwala", "stevenhao"];
  const user_keys = users.flatMap(get_user_keys);
  const merkleTree = {
    users,
    user_keys,
  };
  console.log(JSON.stringify(merkleTree, null, 2));
  return (
    <>
      <h3>MERKLE TREE</h3>
      <textarea
        style={{ height: 400, width: "100%" }}
        value={JSON.stringify(merkleTree, null, 2)}
      />
    </>
  );
}
