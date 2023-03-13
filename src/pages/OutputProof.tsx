import React from "react";
import { useLocation } from "react-router-dom";

export default function OutputProof() {
  // const { proof } = route.params;
  const { state } = useLocation();
  const { proof } = state;

  return (
    <div>
      <h1>New Page</h1>
      <p>This is a new page!</p>
      <p>{proof}</p>
    </div>
  );
}
