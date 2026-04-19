import React from 'react';
import './App.css';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/layout/ErrorBoundary';
import ToastContainer from './components/feedback/ToastContainer';
import FluidCursorEffect from './components/ui/smokey-cursor-effect';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <FluidCursorEffect />
            <AppRoutes />
            <ToastContainer />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
