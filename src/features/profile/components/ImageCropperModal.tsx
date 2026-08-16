import React, { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark, faSearchPlus, faCrop } from "@fortawesome/free-solid-svg-icons";

const CONTAINER_WIDTH = 256;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.05;

interface ImageCropperModalProps {
    rawImageSrc: string;
    onClose: () => void;
    onSave: (croppedDataUrl: string) => void;
    aspectRatio?: number;
    title?: string;
    outputWidth?: number;
}

/**
 * Drag-to-pan, zoom-to-scale image cropper.
 * Used for both avatar (1:1) and cover (3:1) uploads.
 */
export const ImageCropperModal = ({
    rawImageSrc,
    onClose,
    onSave,
    aspectRatio = 1,
    title = "Căn chỉnh ảnh đại diện",
    outputWidth = 400,
}: ImageCropperModalProps) => {
    const containerHeight = CONTAINER_WIDTH / aspectRatio;
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imgDimensions, setImgDimensions] = useState({ baseWidth: 256, baseHeight: 256 });
    const imgRef = useRef<HTMLImageElement | null>(null);

    const clampOffset = (newX: number, newY: number, currentZoom: number) => {
        const currentW = imgDimensions.baseWidth * currentZoom;
        const currentH = imgDimensions.baseHeight * currentZoom;
        const overflowX = Math.max(0, (currentW - CONTAINER_WIDTH) / 2);
        const overflowY = Math.max(0, (currentH - containerHeight) / 2);
        return {
            x: Math.max(-overflowX, Math.min(overflowX, newX)),
            y: Math.max(-overflowY, Math.min(overflowY, newY)),
        };
    };

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        imgRef.current = img;
        const naturalW = img.naturalWidth || img.width;
        const naturalH = img.naturalHeight || img.height;
        const scale = Math.max(CONTAINER_WIDTH / naturalW, containerHeight / naturalH);

        setImgDimensions({ baseWidth: naturalW * scale, baseHeight: naturalH * scale });
        setOffset({ x: 0, y: 0 });
        setZoom(1);
    };

    const handleZoomChange = (newZoom: number) => {
        setZoom(newZoom);
        setOffset((prev) => clampOffset(prev.x, prev.y, newZoom));
    };

    const startDrag = (x: number, y: number) => {
        setIsDragging(true);
        setDragStart({ x: x - offset.x, y: y - offset.y });
    };

    const moveDrag = (x: number, y: number) => {
        if (!isDragging) return;
        setOffset(clampOffset(x - dragStart.x, y - dragStart.y, zoom));
    };

    const endDrag = () => setIsDragging(false);

    const handleCrop = () => {
        if (!imgRef.current) return;
        const canvasWidth = outputWidth;
        const canvasHeight = outputWidth / aspectRatio;
        const ratio = canvasWidth / CONTAINER_WIDTH;

        const canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = "#1e232d";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.save();
        ctx.translate(canvasWidth / 2, canvasHeight / 2);
        ctx.translate(offset.x * ratio, offset.y * ratio);

        const drawW = imgDimensions.baseWidth * zoom * ratio;
        const drawH = imgDimensions.baseHeight * zoom * ratio;
        ctx.drawImage(imgRef.current, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        onSave(canvas.toDataURL("image/jpeg", 0.92));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-surface rounded-3xl p-6 max-w-md w-full flex flex-col items-center gap-4 shadow-2xl">
                <div className="w-full flex items-center justify-between border-b border-border/40 pb-3">
                    <h4 className="font-bold text-text flex items-center gap-2">
                        <FontAwesomeIcon icon={faCrop} className="text-primary" />
                        <span>{title}</span>
                    </h4>
                    <button type="button" onClick={onClose} className="text-text-faint hover:text-text p-1 cursor-pointer" aria-label="Đóng">
                        <FontAwesomeIcon icon={faXmark} className="text-lg" />
                    </button>
                </div>

                <div
                    className="relative rounded-2xl overflow-hidden bg-black border-2 border-primary/60 cursor-move flex items-center justify-center shadow-inner select-none touch-none"
                    style={{ width: CONTAINER_WIDTH, height: containerHeight }}
                    onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
                    onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
                    onMouseUp={endDrag}
                    onMouseLeave={endDrag}
                    onTouchStart={(e) => e.touches[0] && startDrag(e.touches[0].clientX, e.touches[0].clientY)}
                    onTouchMove={(e) => e.touches[0] && moveDrag(e.touches[0].clientX, e.touches[0].clientY)}
                    onTouchEnd={endDrag}
                >
                    <img
                        src={rawImageSrc}
                        alt="Crop target"
                        onLoad={handleImageLoad}
                        className="max-w-none pointer-events-none select-none absolute"
                        style={{
                            width: `${imgDimensions.baseWidth * zoom}px`,
                            height: `${imgDimensions.baseHeight * zoom}px`,
                            left: "50%",
                            top: "50%",
                            transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
                        }}
                    />
                    <div className="absolute inset-0 pointer-events-none border border-white/20 rounded-2xl ring-12 ring-black/40" />
                </div>

                <div className="w-full flex flex-col gap-2 pt-2">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-text-muted shrink-0">Thu phóng:</span>
                        <input
                            type="range"
                            min={MIN_ZOOM}
                            max={MAX_ZOOM}
                            step={ZOOM_STEP}
                            value={zoom}
                            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                            className="flex-1 accent-primary cursor-pointer"
                            aria-label="Thu phóng ảnh"
                        />
                        <button
                            type="button"
                            onClick={() => handleZoomChange(Math.min(MAX_ZOOM, zoom + 0.1))}
                            className="text-text-faint hover:text-text p-1 cursor-pointer"
                            aria-label="Phóng to"
                        >
                            <FontAwesomeIcon icon={faSearchPlus} />
                        </button>
                    </div>
                    <p className="text-[11px] text-center text-text-faint italic mt-1">* Kéo thả ảnh để di chuyển.</p>
                </div>

                <div className="w-full flex items-center justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-surface-hover hover:bg-border text-text font-bold text-xs transition-colors cursor-pointer">
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleCrop}
                        className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs transition-colors shadow-md cursor-pointer flex items-center gap-2"
                    >
                        <FontAwesomeIcon icon={faCheck} />
                        <span>Cắt & Lưu ảnh</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
