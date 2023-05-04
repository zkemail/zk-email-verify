import React, { useState } from "react";
import styled from "styled-components";
import { CenterAllDiv, Col, Row } from "./Layout";
import "./NNS.css";

type Step = {
  title: string;
  description: string;
};

const Step = ({ index, title, description, active, onClick }: any) => (
  <div className={`nns__step ${active ? "active" : ""}`} onClick={() => onClick(index + 1)}>
    <StepCount>{index + 1}</StepCount>
    <StepTitle>{title}</StepTitle>
    {active && <StepDescription>{description}</StepDescription>}
  </div>

);

export const NumberedStep: React.FC<{
  steps: Step[];
}> = ({ steps }) => {
  const [activeStep, setActiveStep] = useState(0);

  const handleClick = (index: number) => {
    if (index == activeStep) {
      setActiveStep(0)
    } else {
    setActiveStep(index);
    };
  };

  const progress = ((activeStep + 1) / steps.length) * 100;

  return (
    <NNSContainer>
      <div className="nns__inner" style={{ height: `${progress}%` }}></div>
      <NNSSteps>
        {steps.map((step, index) => (
          <Step
            key={index}
            index={index}
            title={step.title}
            description={step.description}
            active={index +1 === activeStep}
            onClick={handleClick}
          />
        ))}
      </NNSSteps>
    </NNSContainer>
  );
};

const NNSSteps = styled(CenterAllDiv)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  margin-top: 2rm;
`;

const NNSContainer = styled(Col)`
  width: 100%;
  gap: 1rem;
  border-radius: 4px;
  padding: 8px;
  color: #fff;
`;

const StepCount = styled(CenterAllDiv)`
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  width: 24px;
  height: 24px;
  min-width: 24px;
  border: 1px solid rgba(255, 255, 255, 0.3);
`;

const StepTitle = styled(CenterAllDiv)`
  font-size: 18px;
  font-weight: bold;
`;

const StepDescription = styled(CenterAllDiv)`
  font-size: 14px;
`;

// export default ProgressBar;
