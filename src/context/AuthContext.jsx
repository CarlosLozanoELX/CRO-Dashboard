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

    const login = (payload) => {
        let userData = null;

        if (payload.credential) {
            // Handle standard GoogleLogin response
            const decoded = jwtDecode(payload.credential);
            userData = {
                name: decoded.name,
                email: decoded.email,
                picture: decoded.picture
            };
        } else if (payload.email) {
            // Handle pre-processed custom login
            userData = payload;
        }

        if (!userData) return false;

        // Authorization Logic
        const allowedDomain = 'electrolux.com';
        const isAuthorized = userData.email.endsWith(`@${allowedDomain}`) ||
            userData.email === 'carlos.lozano@electrolux.com';

        if (isAuthorized) {
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
