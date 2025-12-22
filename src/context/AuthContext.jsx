import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('dashboard_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = (credentialResponse) => {
        const decoded = jwtDecode(credentialResponse.credential);

        // Authorization Logic: Change this to your company domain
        const allowedDomain = 'electrolux.com'; // Example domain
        const isAuthorized = decoded.email.endsWith(`@${allowedDomain}`) ||
            decoded.email === 'carlos.lozano@electrolux.com'; // Direct whitelist

        if (isAuthorized) {
            const userData = {
                name: decoded.name,
                email: decoded.email,
                picture: decoded.picture
            };
            setUser(userData);
            localStorage.setItem('dashboard_user', JSON.stringify(userData));
            return true;
        } else {
            alert('Unauthorized: You must use a corporate email to access this dashboard.');
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('dashboard_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
