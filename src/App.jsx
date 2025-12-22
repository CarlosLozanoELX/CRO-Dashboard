import React, { useState } from 'react';
import { DataProvider, useData } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Layout } from './components/Layout';
import { Overview } from './views/Overview';
import { Timeline } from './views/Timeline';
import { Planning } from './views/Planning';
import Repository from './views/Repository';
import MapView from './views/Map';
import Login from './views/Login';

const GOOGLE_CLIENT_ID = "820974093444-bkouffpu20a75hnff397krtnj9sveubt.apps.googleusercontent.com";

const AppContent = () => {
    const { user, loading: authLoading } = useAuth();
    const [view, setView] = useState('overview');
    const { loading: dataLoading, error } = useData();

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-app-bg">
                <div className="w-8 h-8 border-2 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return <Login />;
    }

    if (dataLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-app-bg">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin shadow-[0_0_15px_rgba(0,240,255,0.3)]"></div>
                    <p className="text-gray-400 font-medium font-mono text-sm tracking-widest uppercase animate-pulse">Loading Data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-app-bg">
                <div className="glass-panel p-8 rounded-2xl max-w-md text-center border-neon-pink/30 shadow-[0_0_30px_rgba(255,0,60,0.1)]">
                    <div className="w-16 h-16 bg-neon-pink/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-neon-pink/20">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <h2 className="text-neon-pink text-xl font-bold mb-2 tracking-wide uppercase text-glow">Connection Error</h2>
                    <p className="text-gray-400 mb-6 text-sm">Could not synchronize with the experiment database.</p>
                    <div className="bg-black/40 p-4 rounded-lg text-left border border-white/5">
                        <code className="text-[10px] text-neon-pink font-mono break-all">
                            {error.message}
                        </code>
                    </div>
                </div>
            </div>
        );
    }

    const renderView = () => {
        switch (view) {
            case 'overview': return <Overview />;
            case 'timeline': return <Timeline />;
            case 'planning': return <Planning />;
            case 'repository': return <Repository />;
            case 'map': return <MapView />;
            default: return <Overview />;
        }
    };

    return (
        <Layout currentView={view} onViewChange={setView}>
            {renderView()}
        </Layout>
    );
};

function App() {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AuthProvider>
                <DataProvider>
                    <AppContent />
                </DataProvider>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
