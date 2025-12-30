import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './features/auth/context/AuthContext';
import { ThemeProvider } from './shared/context/ThemeContext';
import { MqttProvider } from './features/mqtt/context/MqttContext';
import { DashboardProvider } from './features/dashboard/context/DashboardContext';
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