import styled from "styled-components";
import { Col } from "./Layout";

export const SingleLineInput: React.FC<{
  label: string;
  value: any;
  onChange: (e: any) => void;
}> = ({ label, onChange, value }) => {
  return (
    <InputContainer>
      <label
        style={{
          color: "rgba(255, 255, 255, 0.8)",
        }}
      >
        {label}
      </label>
      <Input onChange={onChange} value={value} placeholder={label} />
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
