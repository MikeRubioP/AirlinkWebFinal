// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLoginModal, setShowLoginModal] = useState(false); // ✅ NUEVO

    // Verificar si hay un token al cargar la app
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const savedToken = localStorage.getItem('token');
        if (savedToken) {
            setToken(savedToken);
            try {
                const res = await axios.get('http://localhost:5174/auth/me', {
                    headers: { Authorization: `Bearer ${savedToken}` }
                });
                setUser(res.data.usuario);
            } catch (err) {
                console.error('Error al verificar autenticación:', err);
                localStorage.removeItem('token');
                setUser(null);
                setToken(null);
            }
        }
        setLoading(false);
    };

    const login = (userData, authToken) => {
        localStorage.setItem('token', authToken);
        setToken(authToken);
        setUser(userData);
        setShowLoginModal(false); // ✅ NUEVO: Cierra el modal después del login
        console.log('✅ Usuario logueado:', userData.email || userData.nombreUsuario);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
        console.log('👋 Usuario deslogueado');
    };

    const isCliente = () => {
        return user?.idRol === 1;
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            logout,
            checkAuth,
            isCliente,
            isAuthenticated: !!user,
            loading,
            showLoginModal,        // ✅ NUEVO
            setShowLoginModal      // ✅ NUEVO
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};