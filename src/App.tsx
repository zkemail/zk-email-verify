import React from "react";
import { MainPage } from "./pages/MainPage";
import "./styles.css";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
} from "react-router-dom";
import { useLocation } from "react-use";
import { SetupPage } from "./pages/SetupPage";
import styled from "styled-components";

const App = () => {
  return (
    <Router>
      <div>
        <NavSection />

        <Routes>
          <Route
            path="/"
            element={
              <Main>
                <MainPage />
              </Main>
            }
          />
          <Route path="/setup" element={<SetupPage />} />
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

  return <MainPage key={search} />;
};

const NavSection: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <Nav>
      <Link className={pathname === "/" ? "current_page" : "off"} to={"/"}>
        App
      </Link>{" "}
      <Link
        className={pathname === "/setup" ? "current_page" : "off"}
        to="/setup"
      >
        Setup
      </Link>
      <button
        style={{
          borderRadius: 8,
          padding: "8px 12px",
          border: "1px solid black",
          float: "right",
          marginLeft: "auto",
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        <a style={{ textDecoration: "none", color: "black" }} href="/docs">
          Docs
        </a>
      </button>
    </Nav>
  );
};

const Nav = styled.nav`
  display: flex;
  margin: 12px;
  & > a {
    margin-left: 8px;
    font-size: 24px;
  }
`;
