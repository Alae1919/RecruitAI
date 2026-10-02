import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => localStorage.clear());

test('a signed-out visitor lands on the public home page with sign-in and sign-up entry points', async () => {
  render(<App />);
  expect((await screen.findAllByText(/sign in/i)).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/get started/i).length).toBeGreaterThan(0);
});
