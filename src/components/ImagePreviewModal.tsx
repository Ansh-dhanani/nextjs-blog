"use client";

import React, { useCallback, useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, Button } from "@heroui/react";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  caption?: string;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  caption
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
    setIsZoomed(true);
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - 0.25, 0.25);
      if (newZoom === 1) {
        setIsZoomed(false);
      }
      return newZoom;
    });
  };

  const handleWheelZoom = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  }, []);

  const resetZoom = () => {
    setZoomLevel(1);
    setIsZoomed(false);
    setDragPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isZoomed) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - dragPosition.x,
        y: e.clientY - dragPosition.y
      });
    }
  }, [isZoomed, dragPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && isZoomed) {
      setDragPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, isZoomed, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && isZoomed) {
        setDragPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isZoomed, dragStart]);

  const handleClose = () => {
    setZoomLevel(1);
    setIsZoomed(false);
    setDragPosition({ x: 0, y: 0 });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={handleClose}
      size="5xl"
      className="max-h-[90vh]"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <span>{caption || "Image Preview"}</span>
        </ModalHeader>
        <ModalBody className="flex flex-col items-center gap-4">
          <div
            className="relative overflow-hidden"
            onWheel={handleWheelZoom}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              cursor: isZoomed ? (isDragging ? 'grabbing' : 'grab') : 'default',
              userSelect: 'none'
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt={caption || "Preview image"}
              className="max-w-full max-h-[70vh] object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoomLevel}) translate(${dragPosition.x}px, ${dragPosition.y}px)`,
                transformOrigin: 'center center',
                width: 'auto',
                height: 'auto',
                maxWidth: zoomLevel > 1 ? 'none' : '100%',
                maxHeight: zoomLevel > 1 ? 'none' : '70vh',
                pointerEvents: 'none'
              }}
              draggable={false}
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="flat"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.25}
            >
              Zoom Out
            </Button>
            <Button
              size="sm"
              variant="flat"
              onClick={resetZoom}
              disabled={!isZoomed}
            >
              Reset
            </Button>
            <Button
              size="sm"
              variant="flat"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3}
            >
              Zoom In
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ImagePreviewModal;
