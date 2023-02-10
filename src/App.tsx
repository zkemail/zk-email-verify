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
import styled from "styled-components";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const App = () => {
  return (
    <Router>
      <div>
        <NavSection />

        <Routes>
          <Route path="/" element={<Main />} />
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
      <Logo className={pathname === "/" ? "current_page" : "off"} to={"/"}>
        ZK-Email
      </Logo>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <DocsLink href="/docs">Docs</DocsLink>
        <ConnectButton />
      </div>
    </Nav>
  );
};

const Logo = styled(Link)`
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #fff;
  text-decoration: none;
  font-size: 1.2rem;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px;
`;

const DocsLink = styled.a`
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  underline: none;
  transition: all 0.2s ease-in-out;
  &:hover {
    color: rgba(255, 255, 255, 1);
  }
`;
