import styled from "styled-components";

export const Row = styled.div`
  display: flex;
  align-items: center;
`;

export const Col = styled.div`
  display: flex;
  flex-direction: column;
`;

export const RowSpaceBetween = styled(Row)`
  justify-content: space-between;
`;

export const CenterAllDiv = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;
