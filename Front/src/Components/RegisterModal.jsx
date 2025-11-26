import React, { useRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import airlinkLogo from '../assets/airlinkLogo2.png';
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import ValidatedInput from './ValidatedInput';
import VerificationModal from './VerificationModal';
import {
    validateUsername,
    validateEmail,
    validatePassword,
    validatePasswordMatch,
    getPasswordStrength
} from '../utils/validators';

const RegisterModal = ({ isOpen, onClose, onSwitchToLogin }) => {
    const modalRef = useRef(null);
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [showVerification, setShowVerification] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');
    const [formData, setFormData] = useState({
        nombreUsuario: '',
        email: '',
        contrasena: '',
        confirmarContrasena: ''
    });
    const [touchedFields, setTouchedFields] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [generalError, setGeneralError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && !showVerification) {
                onClose();
            }
        };

        const handleOutsideClick = (e) => {
            // No cerrar si el modal de verificación está abierto
            if (showVerification) return;

            if (modalRef.current && !modalRef.current.contains(e.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.addEventListener('mousedown', handleOutsideClick);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('mousedown', handleOutsideClick);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose, showVerification]);

    useEffect(() => {
        if (!isOpen) {
            setShowEmailForm(false);
            setShowVerification(false);
            setFormData({
                nombreUsuario: '',
                email: '',
                contrasena: '',
                confirmarContrasena: ''
            });
            setTouchedFields({});
            setFieldErrors({});
            setGeneralError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Validar en tiempo real solo si el campo ya fue tocado
        if (touchedFields[name]) {
            validateField(name, value);
        }

        setGeneralError('');
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;

        setTouchedFields(prev => ({
            ...prev,
            [name]: true
        }));

        validateField(name, value);
    };

    const validateField = (name, value) => {
        let validation;

        switch (name) {
            case 'nombreUsuario':
                validation = validateUsername(value);
                break;
            case 'email':
                validation = validateEmail(value);
                break;
            case 'contrasena':
                validation = validatePassword(value);
                // También revalidar confirmación si ya fue tocada
                if (touchedFields.confirmarContrasena) {
                    const matchValidation = validatePasswordMatch(value, formData.confirmarContrasena);
                    setFieldErrors(prev => ({
                        ...prev,
                        confirmarContrasena: matchValidation.errors
                    }));
                }
                break;
            case 'confirmarContrasena':
                validation = validatePasswordMatch(formData.contrasena, value);
                break;
            default:
                validation = { errors: [] };
        }

        setFieldErrors(prev => ({
            ...prev,
            [name]: validation.errors
        }));

        return validation.isValid;
    };

    const validateAllFields = () => {
        const fields = ['nombreUsuario', 'email', 'contrasena', 'confirmarContrasena'];
        const newTouchedFields = {};
        const newFieldErrors = {};
        let isValid = true;

        fields.forEach(field => {
            newTouchedFields[field] = true;
            const value = formData[field];
            let validation;

            switch (field) {
                case 'nombreUsuario':
                    validation = validateUsername(value);
                    break;
                case 'email':
                    validation = validateEmail(value);
                    break;
                case 'contrasena':
                    validation = validatePassword(value);
                    break;
                case 'confirmarContrasena':
                    validation = validatePasswordMatch(formData.contrasena, value);
                    break;
                default:
                    validation = { errors: [] };
            }

            newFieldErrors[field] = validation.errors;
            if (!validation.isValid) isValid = false;
        });

        setTouchedFields(newTouchedFields);
        setFieldErrors(newFieldErrors);

        return isValid;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setGeneralError('');

        // Validar todos los campos
        if (!validateAllFields()) {
            setGeneralError('Por favor corrige los errores antes de continuar');
            return;
        }

        setLoading(true);

        try {
            // Sanitizar datos antes de enviar
            const cleanData = {
                nombreUsuario: validateUsername(formData.nombreUsuario).sanitized,
                email: validateEmail(formData.email).sanitized,
                contrasena: formData.contrasena
            };

            await axios.post("http://localhost:5174/auth/register", cleanData);

            // Guardar email y mostrar modal de verificación
            setRegisteredEmail(cleanData.email);
            setShowVerification(true);
        } catch (err) {
            setGeneralError(err.response?.data?.message || "Error en el registro");
        } finally {
            setLoading(false);
        }
    };

    const handleVerified = () => {
        // Cuando el usuario verifique exitosamente (ya está logueado automáticamente)
        setShowVerification(false);
        onClose(); // Cerrar todos los modales

        // Mostrar mensaje de bienvenida
        setTimeout(() => {
            alert("¡Bienvenido a AirLink! 🎉 Tu cuenta ha sido verificada y ya has iniciado sesión");
        }, 100);
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const decoded = jwtDecode(credentialResponse.credential);

            const res = await axios.post("http://localhost:5174/auth/google", {
                googleId: decoded.sub,
                email: decoded.email,
                nombreUsuario: decoded.name,
            });

            localStorage.setItem("token", res.data.token);
            alert("Registro con Google correcto ✅");
            onClose();
            window.location.reload();
        } catch (err) {
            setGeneralError(err.response?.data?.message || "Error en registro con Google");
        }
    };

    const passwordStrength = getPasswordStrength(formData.contrasena);

    return (
        <>
            <div className="fixed inset-0 flex items-center justify-center z-[60] p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                <div
                    ref={modalRef}
                    className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 relative max-h-[90vh] overflow-y-auto"
                    style={{ animation: 'fadeIn 0.2s ease-out' }}
                >
                    <button
                        onClick={onClose}
                        aria-label="Cerrar modal"
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="flex flex-col items-center">
                        <div className="mb-6">
                            <img src={airlinkLogo} alt="AirLink" className="h-20 w-auto" />
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-8">
                            {showEmailForm ? 'Completa tu registro' : 'Regístrate'}
                        </h2>

                        {!showEmailForm ? (
                            <>
                                <button
                                    onClick={() => setShowEmailForm(true)}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors mb-4"
                                >
                                    Continuar con correo
                                </button>

                                <div className="w-full">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => setGeneralError("❌ Error en registro con Google")}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <form onSubmit={handleRegister} className="w-full space-y-4">
                                    <ValidatedInput
                                        label="Nombre de usuario"
                                        type="text"
                                        name="nombreUsuario"
                                        value={formData.nombreUsuario}
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                        placeholder="Nombre"
                                        errors={fieldErrors.nombreUsuario || []}
                                        touched={touchedFields.nombreUsuario}
                                        maxLength={30}
                                        required
                                        autoComplete="username"
                                    />

                                    <ValidatedInput
                                        label="Email"
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                        placeholder="tu@email.com"
                                        errors={fieldErrors.email || []}
                                        touched={touchedFields.email}
                                        maxLength={100}
                                        required
                                        autoComplete="email"
                                    />

                                    <ValidatedInput
                                        label="Contraseña"
                                        type="password"
                                        name="contrasena"
                                        value={formData.contrasena}
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                        placeholder="Crea una contraseña segura"
                                        errors={fieldErrors.contrasena || []}
                                        touched={touchedFields.contrasena}
                                        showPasswordStrength={true}
                                        passwordStrength={passwordStrength}
                                        maxLength={128}
                                        required
                                        autoComplete="new-password"
                                    />

                                    <ValidatedInput
                                        label="Confirmar contraseña"
                                        type="password"
                                        name="confirmarContrasena"
                                        value={formData.confirmarContrasena}
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                        placeholder="Repite tu contraseña"
                                        errors={fieldErrors.confirmarContrasena || []}
                                        touched={touchedFields.confirmarContrasena}
                                        maxLength={128}
                                        required
                                        autoComplete="new-password"
                                    />

                                    {generalError && (
                                        <div className="text-red-600 text-sm text-center bg-red-50 py-2 px-3 rounded">
                                            {generalError}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Enviando código...' : 'Registrarse'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowEmailForm(false);
                                            setTouchedFields({});
                                            setFieldErrors({});
                                        }}
                                        className="w-full text-gray-600 hover:text-gray-800 text-sm font-medium"
                                    >
                                        ← Volver
                                    </button>
                                </form>
                            </>
                        )}

                        <p className="text-xs text-gray-500 text-center mt-6 leading-relaxed">
                            Al continuar, aceptas los {' '}
                            <a href="#" className="text-purple-600 hover:text-purple-700 underline">
                                Términos de servicio
                            </a> {' '}
                            y reconoce que ha leído nuestra {' '}
                            <a href="#" className="text-purple-600 hover:text-purple-700 underline">
                                Política de privacidad
                            </a>{' '}
                            de AirLink.
                        </p>

                        {!showEmailForm && (
                            <p className="text-xs text-gray-600 text-center mt-4">
                                ¿Ya tienes cuenta?{' '}
                                <button
                                    onClick={onSwitchToLogin}
                                    className="text-purple-600 hover:text-purple-700 font-semibold"
                                >
                                    Inicia sesión aquí
                                </button>
                            </p>
                        )}
                    </div>
                </div>

                <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
            </div>

            {/* Modal de verificación */}
            <VerificationModal
                isOpen={showVerification}
                onClose={() => setShowVerification(false)}
                email={registeredEmail}
                onVerified={handleVerified}
            />
        </>
    );
};

export default RegisterModal;