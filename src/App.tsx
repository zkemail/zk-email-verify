import React from "react";
import { Prover } from "./pages/Prover";
import "./styles.css";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
} from "react-router-dom";
import { useLocation } from "react-use";

const proveLandingPage =
  "/?message=I%20like%20cats&group_name=https%3A%2F%2Fgithub.com%2Forgs%2Fdoubleblind-xyz%2Fpeople&group_members=ssh-rsa%20AAAAB3NzaC1yc2EAAAADAQABAAACAQCq8ZasN4NVES99%2B9XRhFLkuT4deiyen01D5nWt8%2FBoqdcCW0jH%2FLLiew%2FxVQ7%2FmMYmEg%2Fw6In8kUMJTCd7oXBDYHNBGxhuIqKEDh15yN5loQykW8YCA74m8V6fdnZ22krFGS%2FnixYr19xEJ2cY28Jq8QNO03421T4QiZsqB8LcMOfMvVPzU96UWHR16LW1Lgj7pGLwbP%2FDBQRWn%2BAlaSYi%2FyHgCit9GgqOf2O7JqQ01p7d9AlBHyTPfDJHJOosKMKiwNwP4Rwyir%2FKeRde65v%2FMqRnBWoQogjTNAylyCMOUDhNZQbiF8ttIynY2xtg5i52Qc9qY%2FBZAk1J%2FSK8MjEae4o8JU%2BfwBGH4aXDLx5AGwD5EHm95M2WiEu8kvcGv%2BbnPp4OED8W2pvoI8Q0PmYJ8WC6vebM4fOg9dnvZ52jUb5mpfWmUy0%2FPeOPyxsfTjpptirNhJUpWWdhDfPNxT19jSka4BYlhHEVXeR1%2BepBXe7z1m0w4RMVFHyDvsr1gUlcWjO9ufccdqNnNjrWcKLIm455RJivh8V1JC%2F2mJdMrYGKf54%2FOXa%2BEMcRpgKO1kjhqDCMitA8IVa8bcVFcvwmB1myoondETeO7bdGIVBMV1o8H%2BU6GL29p%2B5nKzKWUN1IRPgIuMS80sq7MDBkKChzQxJHE%2FhhkszQvAgR9OdzjQ%3D%3D%20scott%0Assh-rsa%20AAAAB3NzaC1yc2EAAAADAQABAAABAQCqu5UxDsmcu7ibKB20ucaYyEsk1EDAa5uXfyDJiH30x4t%2FXwS7b7qdegO1HlvfE1HA7iPqjtbWj70qwDFJwwGazxze33J1oh%2FLMKfPUzZ32y8tRU0JHR9nHZHMOcoUYPNeXLVDh6jdEX3%2B2%2FodIbSVbu54wUF5j6q7iAv%2B6Ch9qcMaO9vPEt3z6QX5LnUAqvCwu5sUgobWB7I10iGD4jFYDL%2Ff22pOGK%2BKyW26vkMh%2Fcg8FNC07ilRiYqQIxfdj7lWaYbO0VhxhQtTH5HcgQ2bAWZ6Rp9%2FcXOAegboV2dxjQ%2FuIumcdaqkXeHNypC3j%2F6%2BTBi5BFMQit8gy1H9R86x%20scott%0A%0Assh-rsa%20AAAAB3NzaC1yc2EAAAADAQABAAABAQDRvpOL7TZcYtHsSSz4lj8vTyIEuFSQnUqHTxhhsEWzAbq9LHMqYm4Whg1oRm430QvJF5xfOaLk%2BbmO6hN1g4Y9yJUj4uhaNSfSl3wGLBxu5OQNngnIDCbxTLjat4Jgz79ZiAo79c6bVq13xcfG0fjtFoC3FbZD0VEmqmwd%2FlYCLLVqtjccQur8B56O9Pj%2FgiDMby0iQPFEe9vlpP8Wg3WVjFRQkwNOhGzvLNrlOBkJXpG9xty43O9T09qHJzKYobrAnlKeRTqYqppVfwmYI7rqr2rqTXF9mBB4s1zUCXJzTVrnqexzeH%2BUv54KIaXxR2CAn3%2BDDtDBfJ4wqk%2F8OBNN%20andrew%0A%0Assh-rsa%20AAAAB3NzaC1yc2EAAAADAQABAAACAQDcJSRy%2BRXANfCgJpzhX9fWEnslgCcgffw5t2mWW5Ltc2cfiWr1w3dUGoSa6oNs1QTwYkdfvy9cv1zwG%2B77a1AhtmjwywahSuOE3yg1IIe6Qo4U7Ae%2B7r8F08Qob7Ct8ZoUHPupbFYyXF759xYpN%2Bvvjuy3MbgTwnbijqH2HUAIwBT2V%2FxbGuwVBNK80i9ib3DNchW%2FwYu9oSukXufzBpPYBZUzAcejCTjPuv3ts%2FL%2BVPJSgaiHeZ%2FqlzU01BQ37dbEieDI6k64IKNppW2l%2BC0ERGtsKjPSINC%2Bx%2BOvS7puOtI%2BAu%2Bp72soaBIrfONsL3oTUgtj82bRzVALCM1Dxh%2BK7O0i00H%2F5xICB4%2Bb%2FGRgho%2BF4IlDf2mDy9qMoyNA8vemH%2FLC9Rc%2BujzIJJHD9WL8nDvg2v8lQGtWDrSlwjRKlp7MtVad%2BCOF6K9oCXjhFWUVirvG%2F1cG%2FYnmzn9%2F2ZEdsYuqL6TEflxtuIM2YdJWIubgnINs3l8P8UwuNa%2FUoM4leBT05LP%2BxbD7%2BHWSXNuWK9%2B7d3t03qOoGdfsbonk9wolM5l04QlTI%2BlOmQObBxHBT7CH4cwWC%2FevovPK9jKkAk%2FAC68YTWAV1U43O9gKmtq67TsShJ9YOeZU6xAp7kAcFVjpABz6suhQa6vGrGCKO8ERp4rLV9KUrgJin86KzQ%3D%3D%20steven%0Assh-rsa%20AAAAB3NzaC1yc2EAAAADAQABAAACAQDBN%2BISLXgsf3xxG18ZSKAwARj%2F0mw0x8JGQoWuCcDB5C99bgC5CMIsm%2F7ZYHye6BdB7GbY3RV%2FaVuLzm2lh2Q9opPT2AJhWDdeYyLhrIRsexNfnUXZsETxI4M7P5mZXNHAVASG%2FQ%2Fgu2lb1aPt5oOiRCI7tvitKLOGrUtb0%2FKToaityX2OJFmEnmH%2BRM6t2ICwmfObterWjzm%2BJ5k1ydFjSSwkx669U%2FGWVf56Rruburz%2FXlDwUm9liVef5iTOH8%2FrSu82ejamZXoYJFCaSq3nCZRw8mb6xs%2BzoiYcKiGozlhg6Zbpkexr4i20vPR5d9rQItaZ38cmbk2HwZzpaqUx%2Ft055CpmUQ2N%2Fvfvzr3rUCeG0SkWsew0m8UDB0AU6LYKCQS50kr0KBYEtE%2Blt46iLf%2B5XrlBhFj99xqx5qOeSY9Pz8xuu3Ti2ckDKhyMTj9uONSBPVOxRslX8PK35L0lQdM8TOjKBpVAWx4Fyag93QWyPFdUD4kB%2BHHSo9FgC9vZxtoxPOpTf8GgIzspGVHL%2BMjW7QmBs%2BcD48K9k6XMmaSq1AEx1JjeysoO5d9bzTygyHAhyZtZftnaTQ6r8OjUGL%2BU9J16Ezp1CwxY8tHpIyh2e6HUuVE8CNkeKLf6j2VIgdQd7b%2BiSPtr3bc43tMYRW9576Qov%2Ft8pP8gEla83w%3D%3D%20steven";
const App = () => {
  return (
    <Router>
      <div>
        <nav>
          <Link to={"/"}>App</Link> <a href={"/docs/"}>Docs</a>{" "}
          <Link to={proveLandingPage}>Demo</Link>
        </nav>

        <Routes>
          <Route
            path="/"
            element={
              <Main>
                <Prover />
              </Main>
            }
          />
          <Route path="/" element={<Navigate to={"/"} replace={true} />} />
          <Route element={<>Not found</>} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;

const Main: React.FC = () => {
  const { search } = useLocation();

  return <Prover key={search} />;
};
