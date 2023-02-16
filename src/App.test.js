import { render, screen } from '@testing-library/react';
import App from './App';


describe('App', () => {
  test('renders app', () => {
    render(<App />);
    const linkElement = screen.getByText(/ZK Email Ownership Proof Generator From Header/i);
    expect(linkElement).toBeInTheDocument();
  });
});
