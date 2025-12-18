import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MqttProvider } from './context/MqttContext';
import { DashboardProvider } from './context/DashboardContext';
import { AppRouter } from './routes/AppRouter';

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <MqttProvider>
                    <DashboardProvider>
                        <AppRouter />
                    </DashboardProvider>
                </MqttProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}