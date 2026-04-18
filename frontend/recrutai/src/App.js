import React from 'react';
import './App.css';
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./hooks/useAuth";

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
