import _ from "lodash";
import React, { CSSProperties } from "react";
import styled from "styled-components";
import { Col } from "./Layout";

export const LabeledTextArea: React.FC<{
  style?: CSSProperties;
  className?: string;
  label: string;
  value: string;
  warning?: string;
  warningColor?: string;
  disabled?: boolean;
  disabledReason?: string;
  link?: string;
  secret?: boolean;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
}> = ({
  style,
  warning,
  warningColor,
  disabled,
  disabledReason,
  label,
  value,
  onChange,
  link,
  className,
  secret,
}) => {
  return (
    <LabeledTextAreaContainer
      className={_.compact(["labeledTextAreaContainer", className]).join(" ")}
    >
      <label>
        {label}
        {link && (
          <a
            style={{ color: "gray", marginLeft: 12 }}
            rel="noreferrer"
            target="_blank"
            href={link}
          >
            Share Link
          </a>
        )}
      </label>
      {warning && (
        <span className="warning" style={{ color: warningColor }}>
          {warning}
        </span>
      )}
      <TextArea
        style={style}
        title={disabled ? disabledReason : ""}
        disabled={disabled}
        value={value}
        onChange={onChange}
      />

      {secret && (
        <div className="secret">Hover to reveal public info sent to chain</div>
      )}
    </LabeledTextAreaContainer>
  );
};

const LabeledTextAreaContainer = styled(Col)`
  height: 15vh;
  border-radius: 4px;
  position: relative;
  gap: 8px;
  & .warning {
    color: #bd3333;
    font-size: 80%;
  }
  &.small {
    label {
      font-size: 16px;
    }
    height: 7vh;
  }
  .secret {
    position: absolute;
    width: 100%;
    height: 100%;
    background: #171717;
    color: #fff;
    user-select: none;
    pointer-events: none;
    opacity: 0.95;
    justify-content: center;
    display: flex;
    align-items: center;
    transition: opacity 0.5s ease-in-out;
  }
  &:hover .secret,
  & :focus + .secret {
    opacity: 0;
  }
`;

const TextArea = styled.textarea`
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: transparent;
  border-radius: 4px;
  height: 15vh;
	padding: 16px;
	transition: all 0.2s ease-in-out;
  &:hover {
		border: 1px solid rgba(255, 255, 255, 0.8);
`;
