import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { FlaskConical, ShieldCheck, Lock } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();

    return (
        <div className="min-h-screen bg-app-bg flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-neon-blue/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-neon-purple/10 rounded-full blur-[120px]"></div>

            <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-white/10 shadow-glow-blue/5 text-center relative z-10 animate-in fade-in zoom-in duration-700">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-neon-blue to-neon-purple rounded-2xl shadow-glow-blue mb-6">
                    <FlaskConical className="text-white w-8 h-8" />
                </div>

                <h1 className="text-3xl font-bold text-white tracking-tight mb-2">CRO Dashboard</h1>
                <p className="text-gray-400 mb-8">Secure Access for Authorized Personnel Only</p>

                <div className="bg-black/40 border border-white/5 rounded-xl p-6 mb-8 text-left">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="p-2 bg-neon-blue/10 rounded-lg">
                            <ShieldCheck className="w-5 h-5 text-neon-blue" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Corporate SSO</h4>
                            <p className="text-xs text-gray-500">Sign in with your corporate Google account to continue.</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <GoogleLogin
                        onSuccess={login}
                        onError={() => console.log('Login Failed')}
                        theme="filled_black"
                        shape="pill"
                        size="large"
                        width="300"
                    />

                    <div className="flex items-center gap-2 mt-4 text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                        <Lock size={12} />
                        <span>Encrypted Session Control</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
