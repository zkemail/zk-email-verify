import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { WagmiConfig, createClient, configureChains, chain } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import {
  getDefaultWallets,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";

import "./index.css";
import "@rainbow-me/rainbowkit/styles.css";

const { chains, provider, webSocketProvider } = configureChains(
  [chain.goerli],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: "ZK Email",
  chains,
});

const client = createClient({
  autoConnect: true,
  connectors,
  provider,
  webSocketProvider,
});

ReactDOM.render(
  <React.StrictMode>
    <WagmiConfig client={client}>
      <RainbowKitProvider chains={chains} theme={darkTheme()}>
        <App />
      </RainbowKitProvider>
    </WagmiConfig>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
