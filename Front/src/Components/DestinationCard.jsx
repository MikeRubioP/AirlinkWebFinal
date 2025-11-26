import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5174";

export default function DestinationCard({ destino, showLink = true }) {
    const navigate = useNavigate();

    const getImageUrl = () => {
        if (!destino.imagen) {
            return `https://source.unsplash.com/600x400/?${destino.ciudad},${destino.pais}`;
        }
        if (destino.imagen.startsWith('http')) {
            return destino.imagen;
        }
        return `${API_URL}${destino.imagen}`;
    };

    const imageUrl = getImageUrl();

    const handleClick = () => {
        if (showLink) {
            // Redirigir a búsqueda de vuelos con destino prellenado
            navigate('/vuelos/buscar', {
                state: {
                    destinoInfo: destino,
                    // Puedes extraer el código de ciudad si lo tienes en tu BD
                    // o usar la ciudad directamente
                }
            });
        }
    };

    const cardContent = (
        <div
            onClick={handleClick}
            className="relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
        >
            <img
                src={imageUrl}
                alt={destino.nombre}
                className="w-full h-48 object-cover"
                onError={(e) => {
                    e.target.src = 'https://source.unsplash.com/600x400/?travel,city';
                }}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent hover:from-black/70 transition-all"></div>

            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h3 className="font-semibold text-lg mb-1">{destino.nombre}</h3>
                <div className="flex items-center justify-between">
                    <p className="text-sm opacity-90">
                        {destino.ciudad && destino.pais ? `${destino.ciudad}, ${destino.pais}` : ''}
                    </p>
                    <p className="text-lg font-bold bg-purple-600 px-3 py-1 rounded-full">
                        ${Number(destino.precio).toLocaleString('es-CL')}
                    </p>
                </div>
                {destino.destacado === 1 && (
                    <span className="absolute top-3 right-3 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
                        ⭐ Destacado
                    </span>
                )}
            </div>
        </div>
    );

    return cardContent;
}