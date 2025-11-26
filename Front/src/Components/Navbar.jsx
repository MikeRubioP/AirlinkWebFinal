// src/Components/Navbar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { User, Menu, X, LogOut, UserCircle } from 'lucide-react';
import airlinkLogo from '../assets/airlinkLogo2.png';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const menuRef = useRef(null);
    const toggleRef = useRef(null);
    const userMenuRef = useRef(null);

    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen((s) => !s);
    };

    const handleLinkClick = () => {
        setIsMobileMenuOpen(false);
    };

    const handleUserClick = () => {
        if (isAuthenticated) {
            setIsUserMenuOpen((prev) => !prev);
        } else {
            setIsLoginModalOpen(true);
        }
    };

    const handleCloseModal = () => {
        setIsLoginModalOpen(false);
        setIsRegisterModalOpen(false);
    };

    const handleLogout = () => {
        logout();
        setIsUserMenuOpen(false);
        navigate('/');
    };

    const handleMyAccount = () => {
        setIsUserMenuOpen(false);
        navigate('/mi-cuenta');
    };

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') {
                setIsMobileMenuOpen(false);
                setIsUserMenuOpen(false);
            }
        };

        const handleOutsideClick = (e) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target) &&
                toggleRef.current &&
                !toggleRef.current.contains(e.target)
            ) {
                setIsMobileMenuOpen(false);
            }

            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(e.target)
            ) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener('keydown', handleKey);
        document.addEventListener('mousedown', handleOutsideClick);

        return () => {
            document.removeEventListener('keydown', handleKey);
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const desktopBase = "px-3 py-2 text-sm font-medium transition-colors duration-200";
    const desktopActive = "text-purple-600 font-semibold";
    const desktopInactive = "text-gray-900 hover:text-purple-600";

    const mobileBase = "hover:bg-gray-50 block px-3 py-2 text-base font-medium rounded-md transition-colors duration-200";
    const mobileActive = "text-purple-600 font-semibold";
    const mobileInactive = "text-gray-900 hover:text-purple-600";

    return (
        <>
            <nav className="bg-white shadow-xs relative z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo izquierda */}
                        <div className="flex-shrink-0 flex items-center">
                            <NavLink to="/" onClick={handleLinkClick} className="flex items-center">
                                <img src={airlinkLogo} alt="AirLink" className="h-20 w-auto" />
                            </NavLink>
                        </div>

                        {/* Menú desktop */}
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-8">

                                <NavLink
                                    to="/"
                                    end
                                    onClick={handleLinkClick}
                                    className={({ isActive }) =>
                                        `${isActive ? desktopActive : desktopInactive} ${desktopBase}`
                                    }
                                >
                                    Inicio
                                </NavLink>

                                <NavLink
                                    to="/Vuelos"
                                    onClick={handleLinkClick}
                                    className={({ isActive }) =>
                                        `${isActive ? desktopActive : desktopInactive} ${desktopBase}`
                                    }
                                >
                                    Vuelos
                                </NavLink>

                                {isAuthenticated && (
                                    <>
                                        <NavLink
                                            to="/mis-viajes"
                                            onClick={handleLinkClick}
                                            className={({ isActive }) =>
                                                `${isActive ? desktopActive : desktopInactive} ${desktopBase}`
                                            }
                                        >
                                            Mis Viajes
                                        </NavLink>

                                        <NavLink
                                            to="/checkin"
                                            onClick={handleLinkClick}
                                            className={({ isActive }) =>
                                                `${isActive ? desktopActive : desktopInactive} ${desktopBase}`
                                            }
                                        >
                                            Check-in
                                        </NavLink>
                                    </>
                                )}

                                <NavLink
                                    to="/cupones"
                                    onClick={handleLinkClick}
                                    className={({ isActive }) =>
                                        `${isActive ? desktopActive : desktopInactive} ${desktopBase}`
                                    }
                                >
                                    Cupones
                                </NavLink>

                                <NavLink
                                    to="/contacto"
                                    onClick={handleLinkClick}
                                    className={({ isActive }) =>
                                        `${isActive ? desktopActive : desktopInactive} ${desktopBase}`
                                    }
                                >
                                    Contacto
                                </NavLink>

                                {!isAuthenticated && (
                                    <NavLink
                                        to="/sobre-nosotros"
                                        onClick={handleLinkClick}
                                        className={({ isActive }) =>
                                            `${isActive ? desktopActive : desktopInactive} ${desktopBase}`
                                        }
                                    >
                                        Sobre nosotros
                                    </NavLink>
                                )}
                            </div>
                        </div>

                        {/* Botón usuario (desktop) */}
                        <div className="hidden md:block relative" ref={userMenuRef}>
                            <button
                                onClick={handleUserClick}
                                aria-label={isAuthenticated ? "Abrir menú de usuario" : "Iniciar sesión"}
                                className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full transition-colors duration-200 flex items-center gap-2"
                            >
                                <User className="h-5 w-5" />
                                {isAuthenticated && (
                                    <span className="pr-2 text-sm font-medium">
                                        {user?.nombreUsuario?.split(' ')[0]}
                                    </span>
                                )}
                            </button>

                            {isAuthenticated && isUserMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                    <div className="px-4 py-3 border-b border-gray-200">
                                        <p className="text-sm font-medium text-gray-900">{user?.nombreUsuario}</p>
                                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setIsUserMenuOpen(false);
                                            navigate('/mi-cuenta');
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                        <UserCircle className="h-4 w-4" />
                                        Mi Cuenta
                                    </button>

                                    <button
                                        onClick={() => {
                                            setIsUserMenuOpen(false);
                                            navigate('/mis-viajes');
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                        </svg>
                                        Mis Viajes
                                    </button>

                                    <button
                                        onClick={() => {
                                            setIsUserMenuOpen(false);
                                            navigate('/checkin');
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                        </svg>
                                        Check-in
                                    </button>

                                    <div className="border-t border-gray-200 mt-1"></div>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Cerrar Sesión
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Menu Mobile toggle */}
                        <div className="md:hidden">
                            <button
                                ref={toggleRef}
                                onClick={toggleMobileMenu}
                                aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
                                aria-controls="mobile-menu"
                                aria-expanded={isMobileMenuOpen}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-900 hover:text-purple-600 hover:bg-gray-100 transition-colors duration-200"
                            >
                                {isMobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {isMobileMenuOpen && (
                    <div
                        ref={menuRef}
                        id="mobile-menu"
                        className="md:hidden absolute top-16 inset-x-0 bg-white shadow-lg border-t"
                        role="menu"
                        aria-label="Menú móvil"
                    >
                        <div className="px-2 pt-2 pb-3 space-y-1">

                            {/* ✅ NUEVO: Buscar pasajes (mobile) */}
                            <NavLink
                                to="/vuelos/buscar"
                                onClick={handleLinkClick}
                                className={({ isActive }) =>
                                    `${isActive ? mobileActive : mobileInactive} ${mobileBase}`
                                }
                                role="menuitem"
                            >
                                Buscar pasajes
                            </NavLink>

                            <NavLink
                                to="/"
                                end
                                onClick={handleLinkClick}
                                className={({ isActive }) =>
                                    `${isActive ? mobileActive : mobileInactive} ${mobileBase}`
                                }
                                role="menuitem"
                            >
                                Inicio
                            </NavLink>

                            <NavLink
                                to="/ofertas"
                                onClick={handleLinkClick}
                                className={({ isActive }) =>
                                    `${isActive ? mobileActive : mobileInactive} ${mobileBase}`
                                }
                                role="menuitem"
                            >
                                Ofertas
                            </NavLink>

                            {isAuthenticated && (
                                <>
                                    <NavLink
                                        to="/mis-viajes"
                                        onClick={handleLinkClick}
                                        className={({ isActive }) =>
                                            `${isActive ? mobileActive : mobileInactive} ${mobileBase}`
                                        }
                                        role="menuitem"
                                    >
                                        Mis Viajes
                                    </NavLink>

                                    <NavLink
                                        to="/checkin"
                                        onClick={handleLinkClick}
                                        className={({ isActive }) =>
                                            `${isActive ? mobileActive : mobileInactive} ${mobileBase}`
                                        }
                                        role="menuitem"
                                    >
                                        Check-in
                                    </NavLink>
                                </>
                            )}

                            <NavLink
                                to="/cupones"
                                onClick={handleLinkClick}
                                className={({ isActive }) =>
                                    `${isActive ? mobileActive : mobileInactive} ${mobileBase}`
                                }
                                role="menuitem"
                            >
                                Cupones
                            </NavLink>

                            <NavLink
                                to="/contacto"
                                onClick={handleLinkClick}
                                className={({ isActive }) =>
                                    `${isActive ? mobileActive : mobileInactive} ${mobileBase}`
                                }
                                role="menuitem"
                            >
                                Contacto
                            </NavLink>

                            {!isAuthenticated && (
                                <NavLink
                                    to="/sobre-nosotros"
                                    onClick={handleLinkClick}
                                    className={({ isActive }) =>
                                        `${isActive ? mobileActive : mobileInactive} ${mobileBase}`
                                    }
                                    role="menuitem"
                                >
                                    Sobre nosotros
                                </NavLink>
                            )}

                            <div className="pt-4 pb-3 border-t border-gray-200">
                                <div className="px-3 space-y-2">
                                    {isAuthenticated ? (
                                        <>
                                            <div className="flex items-center mb-3">
                                                <div className="bg-purple-600 text-white p-2 rounded-full">
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <span className="ml-3 text-gray-900 text-sm font-medium">
                                                    {user?.nombreUsuario}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    handleMyAccount();
                                                    handleLinkClick();
                                                }}
                                                className="w-full text-left px-3 py-2 text-gray-900 hover:bg-gray-100 rounded-md flex items-center gap-2"
                                            >
                                                <UserCircle className="h-5 w-5" />
                                                Mi Cuenta
                                            </button>
                                            <button
                                                onClick={() => {
                                                    handleLogout();
                                                    handleLinkClick();
                                                }}
                                                className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md flex items-center gap-2"
                                            >
                                                <LogOut className="h-5 w-5" />
                                                Cerrar Sesión
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setIsLoginModalOpen(true);
                                                handleLinkClick();
                                            }}
                                            className="w-full flex items-center px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
                                        >
                                            <User className="h-5 w-5 mr-2" />
                                            <span className="text-sm font-medium">Iniciar Sesión</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Modales de Login / Registro */}
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={handleCloseModal}
                onSwitchToRegister={() => {
                    setIsLoginModalOpen(false);
                    setIsRegisterModalOpen(true);
                }}
            />

            <RegisterModal
                isOpen={isRegisterModalOpen}
                onClose={handleCloseModal}
                onSwitchToLogin={() => {
                    setIsRegisterModalOpen(false);
                    setIsLoginModalOpen(true);
                }}
            />
        </>
    );
};

export default Navbar;
