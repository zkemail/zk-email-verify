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
// const MainPage2 extends React.Component<AppProps, AppState> {
function MainPage2() {
  const [inputValue, setInputValue] = useState("");
  const navigate = useNavigate();
  //   constructor(props: AppProps) {
  //     super(props);
  //     this.state = { input: "", inter: "jern" };
  //     this.handleChange = this.handleChange.bind(this);
  //     this.handleSubmit = this.handleSubmit.bind(this);
  //   }
  //   handleChange(e: React.ChangeEvent<HTMLInputElement>) {
  //     this.setState({ input: e.target.value });
  //     // console.log(this.state.input);
  //   }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // console.log(inputValue);
  };
  const handleSubmit = (e: React.ChangeEvent<HTMLInputElement>) => {
    // const inputElement = e.currentTarget.elements.namedItem(
    //   "submit"
    // ) as HTMLInputElement;
    var proof = CreateProof(inputValue);
    setInputValue(proof);
    console.log(inputValue);

    // const navigate = useNavigate();
    navigate("/OutputProof");

    // const history = useHistory();
    // history.pushState("/OutputProof");
    // return <output_proof />;
    // redirect("/OutputProof");
    e.preventDefault();
  };

  //   handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  //     console.log(this.state.inter);
  //     const inputElement = e.currentTarget.elements.namedItem(
  //       "submit"
  //     ) as HTMLInputElement;
  //     // console.log("test" + inputElement.value);
  //     var proof = this.CreateProof(inputElement.value);
  //     console.log("test " + proof);
  //     this.setState({ inter: this.CreateProof(this.state.input) });
  //     console.log(this.state.inter);
  //     e.preventDefault();
  //     // const navigate = useNavigate();
  //     // navigate("/ouput_proof");
  //     // this.props.history.push("./output_proof");
  //   }
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
          <input
            type="text"
            name="submit"
            // value={inputValue}
            onChange={handleChange}
          ></input>
        </label>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
  //   }
}
export default MainPage2;
