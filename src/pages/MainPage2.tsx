import React, { useState } from "react";
import { redirect, useNavigation } from "react-router-dom";
import { OutputProof } from "./OutputProof";
// import { useHistory } from "react-router-dom";
import { useNavigate } from "react-router-dom";
type AppProps = {};
type AppState = { input: string; inter: string };
// interface MainPage2 {
//   output_proof: string;
// }
declare global {
  namespace JSX {
    interface IntrinsicElements {
      outputProof: any;
    }
  }
}
export interface NavigationLeafRoute<Params> {
  params?: Params;
}
// const MainPage2 extends React.Component<AppProps, AppState> {
function MainPage2() {
  const [inputValue, setInputValue] = useState("");
  const navigate = useNavigate();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  const handleSubmit = (e: React.ChangeEvent<HTMLInputElement>) => {
    // const inputElement = e.currentTarget.elements.namedItem(
    //   "submit"
    // ) as HTMLInputElement;
    var proof = CreateProof(inputValue);
    setInputValue(proof);
    console.log(proof);
    navigate("/OutputProof", {
      state: { proof: proof },
    });
    console.log("hey end");
    e.preventDefault();
  };

  const CreateProof = (input: string) => {
    return input + " second";
  };
  //   render() {
  return (
    <div className="App">
      <h1>zkRepo</h1>
      <h3>Get your "Proof-of-Repo" contribution</h3>
      <form onSubmit={handleSubmit}>
        <label>
          place email
          <textarea
            // type="text"
            name="submit"
            // value={inputValue}
            onChange={handleChange}
          ></textarea>
        </label>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
  //   }
}
export default MainPage2;
