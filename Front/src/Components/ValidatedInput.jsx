import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

const ValidatedInput = ({
    label,
    type = 'text',
    name,
    value,
    onChange,
    onBlur,
    placeholder,
    errors = [],
    touched = false,
    showPasswordStrength = false,
    passwordStrength = null,
    disabled = false,
    required = false,
    maxLength,
    autoComplete
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const hasErrors = touched && errors.length > 0;
    const isValid = touched && errors.length === 0 && value;

    const inputType = type === 'password' && showPassword ? 'text' : type;

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                <input
                    type={inputType}
                    name={name}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    maxLength={maxLength}
                    autoComplete={autoComplete}
                    className={`
            w-full px-4 py-2 pr-10 border rounded-lg 
            focus:ring-2 focus:border-transparent outline-none
            transition-colors duration-200
            ${hasErrors
                            ? 'border-red-500 focus:ring-red-500'
                            : isValid
                                ? 'border-green-500 focus:ring-green-500'
                                : 'border-gray-300 focus:ring-purple-600'
                        }
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
                />

                {/* Icono de validación */}
                {touched && value && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {hasErrors ? (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                        ) : (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                    </div>
                )}

                {/* Toggle para mostrar/ocultar contraseña */}
                {type === 'password' && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        tabIndex={-1}
                    >
                        {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                        ) : (
                            <Eye className="h-5 w-5" />
                        )}
                    </button>
                )}
            </div>

            {/* Indicador de fortaleza de contraseña */}
            {showPasswordStrength && passwordStrength && value && (
                <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Fortaleza:</span>
                        <span className={`text-xs font-medium ${passwordStrength.strength <= 2 ? 'text-red-600' :
                            passwordStrength.strength <= 4 ? 'text-yellow-600' :
                                'text-green-600'
                            }`}>
                            {passwordStrength.label}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${(passwordStrength.strength / 6) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Mensajes de error */}
            {hasErrors && (
                <div className="mt-2 space-y-1">
                    {errors.map((error, index) => (
                        <p key={index} className="text-xs text-red-600 flex items-start">
                            <span className="mr-1">•</span>
                            <span>{error}</span>
                        </p>
                    ))}
                </div>
            )}

            {/* Contador de caracteres */}
            {maxLength && value && (
                <p className="text-xs text-gray-500 mt-1 text-right">
                    {value.length} / {maxLength}
                </p>
            )}
        </div>
    );
};

export default ValidatedInput;