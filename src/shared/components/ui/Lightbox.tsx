import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faChevronLeft, faChevronRight, faMagnifyingGlassPlus, faMagnifyingGlassMinus, faRotateRight } from "@fortawesome/free-solid-svg-icons";

interface LightboxProps {
    images: string[];
    initialIndex: number;
    onClose: () => void;
}

export const Lightbox = ({ images, initialIndex, onClose }: LightboxProps) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const resetZoom = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    const showNext = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
        resetZoom();
    };

    const showPrev = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
        resetZoom();
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") showNext();
            if (e.key === "ArrowLeft") showPrev();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex]);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, []);

    const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.5, 4));
    const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.5, 1));

    const handleWheel = (e: React.WheelEvent) => {
        if (e.deltaY < 0) handleZoomIn();
        else handleZoomOut();
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (scale > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && scale > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    return createPortal(
        <div 
            className="fixed inset-0 z-100 flex items-center justify-center animate-fade-in select-none"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onWheel={handleWheel}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div 
                className="absolute inset-0 bg-black/90 backdrop-blur-sm cursor-zoom-out"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
            />

            <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors z-[101]"
            >
                <FontAwesomeIcon icon={faXmark} className="text-xl" />
            </button>

            <div className="absolute top-4 left-4 flex flex-row gap-2 z-[101]">
                <button onClick={(e) => { e.stopPropagation(); handleZoomIn(); }} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors">
                    <FontAwesomeIcon icon={faMagnifyingGlassPlus} className="text-sm" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleZoomOut(); }} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors">
                    <FontAwesomeIcon icon={faMagnifyingGlassMinus} className="text-sm" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); resetZoom(); }} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors">
                    <FontAwesomeIcon icon={faRotateRight} className="text-sm" />
                </button>
            </div>

            {images.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); showPrev(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors z-[101]"
                    >
                        <FontAwesomeIcon icon={faChevronLeft} className="text-xl pr-1" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); showNext(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors z-[101]"
                    >
                        <FontAwesomeIcon icon={faChevronRight} className="text-xl pl-1" />
                    </button>
                </>
            )}

            <div className="relative w-full h-full max-w-6xl max-h-screen p-4 md:p-8 flex items-center justify-center pointer-events-none z-[101] overflow-hidden">
                <img
                    src={images[currentIndex]}
                    alt={`Image ${currentIndex + 1}`}
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                    }}
                    className={`max-w-full max-h-full object-contain pointer-events-auto shadow-2xl rounded-sm ${scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                    onClick={(e) => e.stopPropagation()} 
                    onMouseDown={handleMouseDown}
                    draggable={false}
                />
            </div>
            
            {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/50 text-white text-sm font-medium z-[101]">
                    {currentIndex + 1} / {images.length}
                </div>
            )}
        </div>,
        document.body
    );
};
