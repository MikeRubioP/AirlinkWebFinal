import React, { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Plane } from "lucide-react";
import DestinationCard from "../../Components/DestinationCard.jsx";

const API_URL = "http://localhost:5174";

export default function Vuelos() {
    const [destinos, setDestinos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`${API_URL}/destinos`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                console.log('Respuesta del servidor:', data);

                let destinosArray = [];

                if (Array.isArray(data)) {
                    destinosArray = data;
                } else if (data.items && Array.isArray(data.items)) {
                    destinosArray = data.items;
                } else {
                    throw new Error('La respuesta no contiene un array de destinos');
                }

                setDestinos(destinosArray);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error cargando destinos:', err);
                setError(err.message);
                setLoading(false);
            });
    }, []);

    const agruparPorRegion = () => {
        const grupos = {
            nacional: [],
            internacional: []
        };

        destinos.forEach(d => {
            const pais = (d.pais || '').toLowerCase();

            if (pais.includes('chile')) {
                grupos.nacional.push(d);
            } else {
                grupos.internacional.push(d);
            }
        });

        return grupos;
    };

    const { nacional, internacional } = agruparPorRegion();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando vuelos disponibles...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Error al cargar vuelos</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50">
            {/* HERO */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <Plane className="w-10 h-10" />
                        <h1 className="text-4xl font-bold">Vuelos Disponibles</h1>
                    </div>
                    <p className="text-blue-100 text-lg">
                        Encuentra los mejores vuelos a destinos nacionales e internacionales
                    </p>
                </div>
            </div>

            {/* VUELOS NACIONALES */}
            {nacional.length > 0 && (
                <section className="max-w-7xl mx-auto px-6 py-12">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-2">
                            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
                            Vuelos Nacionales
                        </h2>
                        <p className="text-gray-600 ml-5">Explora Chile de norte a sur</p>
                    </div>
                    <Carousel destinos={nacional} />
                </section>
            )}

            {/* VUELOS INTERNACIONALES */}
            {internacional.length > 0 && (
                <section className="max-w-7xl mx-auto px-6 py-12 pb-20">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-2">
                            <div className="w-1 h-8 bg-indigo-600 rounded-full"></div>
                            Vuelos Internacionales
                        </h2>
                        <p className="text-gray-600 ml-5">Descubre destinos alrededor del mundo</p>
                    </div>
                    <Carousel destinos={internacional} />
                </section>
            )}

            {destinos.length === 0 && !loading && (
                <div className="max-w-7xl mx-auto px-6 py-20 text-center">
                    <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No hay vuelos disponibles en este momento</p>
                </div>
            )}
        </div>
    );
}

function Carousel({ destinos }) {
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        checkScroll();
        const ref = scrollRef.current;
        if (ref) {
            ref.addEventListener('scroll', checkScroll);
            return () => ref.removeEventListener('scroll', checkScroll);
        }
    }, [destinos]);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = 400;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="relative">
            {canScrollLeft && (
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-xl rounded-full p-3 hover:bg-gray-50 transition transform hover:scale-110"
                    aria-label="Anterior"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
            )}

            <div
                ref={scrollRef}
                className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {destinos.map((destino) => (
                    <div key={destino.idDestino} className="flex-shrink-0 w-80">
                        <DestinationCard destino={destino} showLink={true} />
                    </div>
                ))}
            </div>

            {canScrollRight && (
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-xl rounded-full p-3 hover:bg-gray-50 transition transform hover:scale-110"
                    aria-label="Siguiente"
                >
                    <ChevronRight className="w-6 h-6 text-gray-700" />
                </button>
            )}
        </div>
    );
}