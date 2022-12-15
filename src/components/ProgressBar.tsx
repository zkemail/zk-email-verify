import styled from "styled-components";

export interface ProgressBarProps {
  width: number;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ width, label }) => {
  return (
    <ProgressBarContainer>
      {label && (
        <LabelContainer>
          <span>{label}</span>
        </LabelContainer>
      )}
      <ProgressBarFill width={width} />
    </ProgressBarContainer>
  );
};

const ProgressBarContainer = styled.div`
  background: linear-gradient(
    90deg,
    #4860b0 51.26%,
    #51589f 86.64%,
    #5a518f 100%
  );
  border-radius: 4px;
  height: 32px;
  position: relative;
  width: 100%;
`;

const ProgressBarFill = styled.div<{ width: number }>`
  background: #7796ff;
  border-radius: 4px;
  height: 32px;
  width: ${(props) => props.width}%;
`;

const LabelContainer = styled.div`
  display: flex;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  letter-spacing: -0.02em;
  color: #fff;
`;
