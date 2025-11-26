import React, { useState, useRef, useEffect } from 'react';
import { X, Mail, RefreshCw } from 'lucide-react';
import axios from 'axios';
import airlinkLogo from '../assets/airlinkLogo2.png';

const VerificationModal = ({ isOpen, onClose, email, onVerified }) => {
    const modalRef = useRef(null);
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [timer, setTimer] = useState(600); // 10 minutos en segundos
    const inputRefs = useRef([]);

    useEffect(() => {
        if (!isOpen) return;

        const countdown = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(countdown);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(countdown);
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
            // Focus en el primer input
            inputRefs.current[0]?.focus();
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);
        setError('');

        // Auto-focus al siguiente input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        if (!/^\d+$/.test(pastedData)) return;

        const newCode = pastedData.split('');
        setCode([...newCode, ...Array(6 - newCode.length).fill('')]);

        const nextIndex = Math.min(pastedData.length, 5);
        inputRefs.current[nextIndex]?.focus();
    };

    const handleVerify = async () => {
        const fullCode = code.join('');

        if (fullCode.length !== 6) {
            setError('Por favor ingresa el código completo');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await axios.post('http://localhost:5174/auth/verify-code', {
                email,
                code: fullCode
            });

            // Éxito
            onVerified();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Código incorrecto');
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setResending(true);
        setError('');

        try {
            await axios.post('http://localhost:5174/auth/resend-code', { email });
            setTimer(600); // Reiniciar timer
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al reenviar código');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[70] p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div
                ref={modalRef}
                className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 relative"
                style={{ animation: 'fadeIn 0.2s ease-out' }}
            >
                <button
                    onClick={onClose}
                    aria-label="Cerrar modal"
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="flex flex-col items-center">
                    <div className="mb-6">
                        <img src={airlinkLogo} alt="AirLink" className="h-16 w-auto" />
                    </div>

                    <div className="bg-purple-100 rounded-full p-3 mb-4">
                        <Mail className="h-8 w-8 text-purple-600" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Verifica tu correo
                    </h2>

                    <p className="text-gray-600 text-center mb-6 text-sm">
                        Hemos enviado un código de 6 dígitos a<br />
                        <span className="font-semibold text-gray-900">{email}</span>
                    </p>

                    {/* Inputs del código */}
                    <div className="flex gap-2 mb-4" onPaste={handlePaste}>
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                                disabled={loading}
                            />
                        ))}
                    </div>

                    {/* Timer */}
                    <div className="text-sm text-gray-500 mb-4">
                        {timer > 0 ? (
                            <span>Código válido por: <span className="font-semibold text-purple-600">{formatTime(timer)}</span></span>
                        ) : (
                            <span className="text-red-600 font-semibold">Código expirado</span>
                        )}
                    </div>

                    {error && (
                        <div className="w-full text-red-600 text-sm text-center bg-red-50 py-2 px-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleVerify}
                        disabled={loading || code.join('').length !== 6}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                    >
                        {loading ? 'Verificando...' : 'Verificar código'}
                    </button>

                    <button
                        onClick={handleResendCode}
                        disabled={resending || timer > 540} // No permitir reenviar en los primeros 60 segundos
                        className="flex items-center gap-2 text-purple-600 hover:text-purple-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw className={`h-4 w-4 ${resending ? 'animate-spin' : ''}`} />
                        {resending ? 'Reenviando...' : '¿No recibiste el código? Reenviar'}
                    </button>

                    <p className="text-xs text-gray-500 text-center mt-6">
                        Revisa tu carpeta de spam si no ves el correo
                    </p>
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
    );
};

export default VerificationModal;