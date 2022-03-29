import React from "react";
import { Prover } from "./pages/Prover";
import { Verifier } from "./pages/Verifier";
import "./styles.css";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
} from "react-router-dom";

const App = () => {
  return (
    <Router>
      <div>
        <nav>
          <Link to={"/prove"}>Prover</Link> <Link to={"/verify"}>Verifier</Link>
        </nav>

        <Routes>
          <Route path="/prove" element={<Prover />} />
          <Route path="/verify" element={<Verifier />} />
          <Route path="/" element={<Navigate to="/prove" replace={true} />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
