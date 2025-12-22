import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MqttProvider } from './context/MqttContext';
import { DashboardProvider } from './context/DashboardContext';
import { ThemeProvider } from './context/ThemeContext'; // <--- Import
import { AppRouter } from './routes/AppRouter';

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ThemeProvider> {/* <--- Wrap here */}
                    <MqttProvider>
                        <DashboardProvider>
                            <AppRouter />
                        </DashboardProvider>
                    </MqttProvider>
                </ThemeProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}