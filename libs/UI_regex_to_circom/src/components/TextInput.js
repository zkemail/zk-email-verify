import React, { useState, FC } from "react";
import styled from "styled-components";
import { Col } from "./Layout";

// One-line textbox for user-input Regexes. Compatible with
// button to create a MinDFA in a GraphDFA object.

export const TextInput = ({ label, onChange, value }) => {
  return (
    <InputContainer>
      <label
        style={{
          color: "rgba(255, 255, 255, 0.8)",
        }}
      >
        {label}
      </label>
      <textarea onChange={onChange} value={value} placeholder={label} />
    </InputContainer>
  );
};

const InputContainer = styled(Col)`
  gap: 8px;
`;

const Input = styled.input`
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  padding: 8px;
  height: 32px;
  display: flex;
  align-items: center;
  color: #fff;
  transition: all 0.2s ease-in-out;
  &:hover {
    border: 1px solid rgba(255, 255, 255, 0.8);
  }
`;
