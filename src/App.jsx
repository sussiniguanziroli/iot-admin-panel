// src/App.jsx
import React, { useState } from 'react';
import { DashboardProvider } from './context/DashboardContext'; // Asegúrate de crear la carpeta y archivo
import MainLayout from './components/layout/MainLayout'; // Asegúrate de crear la carpeta y archivo
import { MqttProvider } from './context/MqttContext'; 

// Componentes Placeholder para las otras pestañas
const PlaceholderPage = ({ title }) => (
    <div className="flex flex-col items-center justify-center h-full text-slate-400 border-2 border-dashed border-slate-300 rounded-2xl">
        <span className="text-4xl mb-4">🚧</span>
        <h3 className="text-xl font-semibold">Sección {title}</h3>
        <p>Próximamente disponible</p>
    </div>
);

// El Dashboard Real (Donde meteremos los widgets después)
import DashboardPage from './pages/Dashboard'; // Lo crearemos en el siguiente paso

function AppContent() {
    const [activeTab, setActiveTab] = useState('dashboard');

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <DashboardPage />; // Aquí irá tu magia IoT
            case 'analytics': return <PlaceholderPage title="Estadísticas" />;
            case 'users': return <PlaceholderPage title="Usuarios" />;
            default: return <DashboardPage />;
        }
    };

    return (
        <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
            {renderContent()}
        </MainLayout>
    );
}

export default function App() {
    return (
        <MqttProvider>
            <DashboardProvider>
                <AppContent />
            </DashboardProvider>
        </MqttProvider>
    );
}