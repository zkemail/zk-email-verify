import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('@rainbow-me/rainbowkit', () => {
  return {
    ConnectButton: () => '',
  };
});

jest.mock("wagmi", () => {
  return {
    __esModule: true,
    usePrepareContractWrite: () => {
      return {
        config: {}
      };
    },
    useAccount: () => { 
      return {
        address: "0x00000000000000000000"
      };
    },
    useContractWrite: () => {
      const data = {};
      const isLoading = false;
      const isSuccess = true;
      const write = jest.fn();
      return {
        data, isLoading, isSuccess, write 
      };
    }
  };
});


describe('App', () => {
  test('renders app', () => {
    render(<App />);
    const linkElement = screen.getByText(/ZK Email Ownership Proof Generator From Header/i);
    expect(linkElement).toBeInTheDocument();
  });
});
