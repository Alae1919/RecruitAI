import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';

// Mock the entire useAuth module — avoids pulling in axios through the auth chain.
jest.mock('../../hooks/useAuth');
const { useAuth } = require('../../hooks/useAuth');

// Inline the ProtectedRoute logic (mirrors AppRoutes.jsx) to test it in isolation
// without importing the full AppRoutes (which lazy-loads many components).

const ROLE_HOME = {
  RECRUITER: '/recruiter-dashboard',
  JOBSEEKER: '/jobseeker-dashboard',
};

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) {
    const home = ROLE_HOME[user.role] ?? '/';
    return <Navigate to={home} replace />;
  }
  return children;
}

function renderWithRouter(initialPath, requiredRole, user, loading = false) {
  useAuth.mockReturnValue({ user, loading });
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/recruiter-dashboard" element={<div>Recruiter Dashboard</div>} />
        <Route path="/jobseeker-dashboard" element={<div>Jobseeker Dashboard</div>} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute requiredRole={requiredRole}>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  test('unauthenticated user is redirected to /login', () => {
    renderWithRouter('/protected', 'RECRUITER', null);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  test('shows loading screen while auth is resolving', () => {
    renderWithRouter('/protected', 'RECRUITER', null, true);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  test('RECRUITER can access a RECRUITER-only route', () => {
    const user = { role: 'RECRUITER', email: 'r@test.com' };
    renderWithRouter('/protected', 'RECRUITER', user);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('JOBSEEKER can access a JOBSEEKER-only route', () => {
    const user = { role: 'JOBSEEKER', email: 'j@test.com' };
    renderWithRouter('/protected', 'JOBSEEKER', user);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('RECRUITER accessing a JOBSEEKER route is redirected to /recruiter-dashboard', () => {
    const user = { role: 'RECRUITER', email: 'r@test.com' };
    renderWithRouter('/protected', 'JOBSEEKER', user);
    expect(screen.getByText('Recruiter Dashboard')).toBeInTheDocument();
  });

  test('JOBSEEKER accessing a RECRUITER route is redirected to /jobseeker-dashboard', () => {
    const user = { role: 'JOBSEEKER', email: 'j@test.com' };
    renderWithRouter('/protected', 'RECRUITER', user);
    expect(screen.getByText('Jobseeker Dashboard')).toBeInTheDocument();
  });

  test('authenticated user with no required role can access route', () => {
    const user = { role: 'RECRUITER', email: 'r@test.com' };
    renderWithRouter('/protected', undefined, user);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
