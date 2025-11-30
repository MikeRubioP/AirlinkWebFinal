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
    const [token, setToken] = useState(null); // ✅ Agregado: estado del token
    const [loading, setLoading] = useState(true);

    // Verificar si hay un token al cargar la app
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const savedToken = localStorage.getItem('token');
        if (savedToken) {
            setToken(savedToken); // ✅ Guardar token en estado
            try {
                const res = await axios.get('http://localhost:5174/auth/me', {
                    headers: { Authorization: `Bearer ${savedToken}` }
                });
                setUser(res.data.usuario);
            } catch (err) {
                console.error('Error al verificar autenticación:', err);
                localStorage.removeItem('token');
                setUser(null);
                setToken(null); // ✅ Limpiar token en estado
            }
        }
        setLoading(false);
    };

    const login = (userData, authToken) => {
        localStorage.setItem('token', authToken);
        setToken(authToken); // ✅ Guardar token en estado
        setUser(userData);
        console.log('✅ Usuario logueado:', userData.email || userData.nombreUsuario);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setToken(null); // ✅ Limpiar token en estado
        console.log('👋 Usuario deslogueado');
    };

    const isCliente = () => {
        return user?.idRol === 1;
    };

    return (
        <AuthContext.Provider value={{
            user,
            token, // ✅ Exportar token (requerido por MisViajes y DetalleVuelo)
            login,
            logout,
            checkAuth,
            isCliente,
            isAuthenticated: !!user,
            loading
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};