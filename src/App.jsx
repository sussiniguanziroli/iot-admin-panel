import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './routes/AppRouter';
import { AuthProvider } from './features/auth/context/AuthContext';
import { DashboardProvider } from './features/dashboard/context/DashboardContext';
import { MqttProvider } from './features/mqtt/context/MqttContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider } from './shared/context/ThemeContext';

function App() {
  return (
    <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <MqttProvider>
          <DashboardProvider>
            <AppRouter />
            <ToastContainer
              position="bottom-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </DashboardProvider>
        </MqttProvider>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;