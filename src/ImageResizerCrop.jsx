import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Scissors, Maximize2, RotateCcw, Info, Github, Linkedin, Globe } from 'lucide-react';

export default function ImageResizerCrop() {
  const [image, setImage] = useState(null);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [resizeMode, setResizeMode] = useState('pixels');
  const [resizeWidth, setResizeWidth] = useState('');
  const [resizeHeight, setResizeHeight] = useState('');
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [outputFormat, setOutputFormat] = useState('png');
  const [quality, setQuality] = useState(90);
  const [activeTab, setActiveTab] = useState('resize');
  
  // Enhanced crop states
  const [cropArea, setCropArea] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [aspectRatioPreset, setAspectRatioPreset] = useState('free');
  
  const canvasRef = useRef(null);
  const cropCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);
  const cropContainerRef = useRef(null);

  const aspectRatioPresets = {
    free: null,
    '1:1': 1,
    '4:3': 4/3,
    '16:9': 16/9,
    '3:2': 3/2,
    '2:3': 2/3,
    '9:16': 9/16
  };

  useEffect(() => {
    if (image && canvasRef.current) {
      drawImage();
    }
  }, [image, resizeWidth, resizeHeight, resizeMode]);

  useEffect(() => {
    if (image && cropCanvasRef.current && activeTab === 'crop') {
      drawCropPreview();
    }
  }, [image, cropArea, activeTab]);

  // Handle resize mode changes - convert values
  useEffect(() => {
    if (!originalDimensions.width || !originalDimensions.height) return;
    
    if (resizeMode === 'percentage') {
      // Convert pixels to percentage
      if (resizeWidth && !isNaN(parseFloat(resizeWidth))) {
        const percentW = (parseFloat(resizeWidth) / originalDimensions.width) * 100;
        setResizeWidth(Math.round(percentW).toString());
      }
      if (resizeHeight && !isNaN(parseFloat(resizeHeight))) {
        const percentH = (parseFloat(resizeHeight) / originalDimensions.height) * 100;
        setResizeHeight(Math.round(percentH).toString());
      }
    } else {
      // Convert percentage to pixels
      if (resizeWidth && !isNaN(parseFloat(resizeWidth))) {
        const pixelsW = (parseFloat(resizeWidth) / 100) * originalDimensions.width;
        setResizeWidth(Math.round(pixelsW).toString());
      }
      if (resizeHeight && !isNaN(parseFloat(resizeHeight))) {
        const pixelsH = (parseFloat(resizeHeight) / 100) * originalDimensions.height;
        setResizeHeight(Math.round(pixelsH).toString());
      }
    }
  }, [resizeMode]);

  // Handle aspect ratio preset changes for crop
  useEffect(() => {
    if (!image || !cropArea || aspectRatioPreset === 'free') return;
    
    const aspectRatio = aspectRatioPresets[aspectRatioPreset];
    if (!aspectRatio) return;
    
    // Adjust crop area to match the selected aspect ratio
    let newWidth = cropArea.width;
    let newHeight = newWidth / aspectRatio;
    
    // If new height exceeds image bounds, calculate based on height
    if (cropArea.y + newHeight > image.height) {
      newHeight = image.height - cropArea.y;
      newWidth = newHeight * aspectRatio;
    }
    
    // If new width exceeds image bounds, recalculate
    if (cropArea.x + newWidth > image.width) {
      newWidth = image.width - cropArea.x;
      newHeight = newWidth / aspectRatio;
    }
    
    // Center the crop area if possible
    let newX = cropArea.x + (cropArea.width - newWidth) / 2;
    let newY = cropArea.y + (cropArea.height - newHeight) / 2;
    
    // Keep within bounds
    newX = Math.max(0, Math.min(newX, image.width - newWidth));
    newY = Math.max(0, Math.min(newY, image.height - newHeight));
    
    setCropArea({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight
    });
  }, [aspectRatioPreset]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          imageRef.current = img;
          setOriginalDimensions({ width: img.width, height: img.height });
          setResizeWidth(img.width.toString());
          setResizeHeight(img.height.toString());
          
          // Initialize crop area with 80% of image centered
          const cropWidth = img.width * 0.8;
          const cropHeight = img.height * 0.8;
          setCropArea({
            x: (img.width - cropWidth) / 2,
            y: (img.height - cropHeight) / 2,
            width: cropWidth,
            height: cropHeight
          });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResizeWidthChange = (value) => {
    setResizeWidth(value);
    if (maintainAspect && value && originalDimensions.width) {
      const ratio = originalDimensions.height / originalDimensions.width;
      if (resizeMode === 'pixels') {
        setResizeHeight(Math.round(parseFloat(value) * ratio).toString());
      } else {
        setResizeHeight(value);
      }
    }
  };

  const handleResizeHeightChange = (value) => {
    setResizeHeight(value);
    if (maintainAspect && value && originalDimensions.height) {
      const ratio = originalDimensions.width / originalDimensions.height;
      if (resizeMode === 'pixels') {
        setResizeWidth(Math.round(parseFloat(value) * ratio).toString());
      } else {
        setResizeWidth(value);
      }
    }
  };

  const getResizedDimensions = () => {
    if (!resizeWidth || !resizeHeight) return originalDimensions;
    
    if (resizeMode === 'pixels') {
      return {
        width: parseFloat(resizeWidth) || originalDimensions.width,
        height: parseFloat(resizeHeight) || originalDimensions.height
      };
    } else {
      const percentW = parseFloat(resizeWidth) / 100;
      const percentH = parseFloat(resizeHeight) / 100;
      return {
        width: Math.round(originalDimensions.width * percentW),
        height: Math.round(originalDimensions.height * percentH)
      };
    }
  };

  const drawImage = () => {
    if (!image || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dimensions = getResizedDimensions();
    
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, dimensions.width, dimensions.height);
  };

  const drawCropPreview = () => {
    if (!image || !cropCanvasRef.current || !cropArea) return;
    
    const canvas = cropCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const containerWidth = canvas.parentElement.clientWidth;
    const scale = Math.min(containerWidth / image.width, 500 / image.height, 1);
    
    canvas.width = image.width * scale;
    canvas.height = image.height * scale;
    
    // Draw the full image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    
    // Draw semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Clear the crop area to show the image
    const scaledCrop = {
      x: cropArea.x * scale,
      y: cropArea.y * scale,
      width: cropArea.width * scale,
      height: cropArea.height * scale
    };
    
    ctx.clearRect(scaledCrop.x, scaledCrop.y, scaledCrop.width, scaledCrop.height);
    ctx.drawImage(
      image,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      scaledCrop.x, scaledCrop.y, scaledCrop.width, scaledCrop.height
    );
    
    // Draw crop border
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.strokeRect(scaledCrop.x, scaledCrop.y, scaledCrop.width, scaledCrop.height);
    
    // Draw grid lines (rule of thirds)
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
    ctx.lineWidth = 1;
    // Vertical lines
    ctx.beginPath();
    ctx.moveTo(scaledCrop.x + scaledCrop.width / 3, scaledCrop.y);
    ctx.lineTo(scaledCrop.x + scaledCrop.width / 3, scaledCrop.y + scaledCrop.height);
    ctx.moveTo(scaledCrop.x + (scaledCrop.width * 2) / 3, scaledCrop.y);
    ctx.lineTo(scaledCrop.x + (scaledCrop.width * 2) / 3, scaledCrop.y + scaledCrop.height);
    // Horizontal lines
    ctx.moveTo(scaledCrop.x, scaledCrop.y + scaledCrop.height / 3);
    ctx.lineTo(scaledCrop.x + scaledCrop.width, scaledCrop.y + scaledCrop.height / 3);
    ctx.moveTo(scaledCrop.x, scaledCrop.y + (scaledCrop.height * 2) / 3);
    ctx.lineTo(scaledCrop.x + scaledCrop.width, scaledCrop.y + (scaledCrop.height * 2) / 3);
    ctx.stroke();
    
    // Draw corner handles (larger and more visible)
    const handleSize = 12;
    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    const corners = [
      { x: scaledCrop.x, y: scaledCrop.y, cursor: 'nw-resize' },
      { x: scaledCrop.x + scaledCrop.width, y: scaledCrop.y, cursor: 'ne-resize' },
      { x: scaledCrop.x, y: scaledCrop.y + scaledCrop.height, cursor: 'sw-resize' },
      { x: scaledCrop.x + scaledCrop.width, y: scaledCrop.y + scaledCrop.height, cursor: 'se-resize' }
    ];
    
    corners.forEach(({ x, y }) => {
      ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
    });
    
    // Draw edge handles
    const edges = [
      { x: scaledCrop.x + scaledCrop.width / 2, y: scaledCrop.y, cursor: 'n-resize' },
      { x: scaledCrop.x + scaledCrop.width / 2, y: scaledCrop.y + scaledCrop.height, cursor: 's-resize' },
      { x: scaledCrop.x, y: scaledCrop.y + scaledCrop.height / 2, cursor: 'w-resize' },
      { x: scaledCrop.x + scaledCrop.width, y: scaledCrop.y + scaledCrop.height / 2, cursor: 'e-resize' }
    ];
    
    edges.forEach(({ x, y }) => {
      ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
    });
  };

  const getHandleAtPosition = (x, y, scale) => {
    if (!cropArea) return null;
    
    const scaledCrop = {
      x: cropArea.x * scale,
      y: cropArea.y * scale,
      width: cropArea.width * scale,
      height: cropArea.height * scale
    };
    
    const handleSize = 12;
    const threshold = handleSize;
    
    // Check corners
    const corners = [
      { x: scaledCrop.x, y: scaledCrop.y, handle: 'nw' },
      { x: scaledCrop.x + scaledCrop.width, y: scaledCrop.y, handle: 'ne' },
      { x: scaledCrop.x, y: scaledCrop.y + scaledCrop.height, handle: 'sw' },
      { x: scaledCrop.x + scaledCrop.width, y: scaledCrop.y + scaledCrop.height, handle: 'se' }
    ];
    
    for (const corner of corners) {
      if (Math.abs(x - corner.x) < threshold && Math.abs(y - corner.y) < threshold) {
        return corner.handle;
      }
    }
    
    // Check edges
    const edges = [
      { x: scaledCrop.x + scaledCrop.width / 2, y: scaledCrop.y, handle: 'n' },
      { x: scaledCrop.x + scaledCrop.width / 2, y: scaledCrop.y + scaledCrop.height, handle: 's' },
      { x: scaledCrop.x, y: scaledCrop.y + scaledCrop.height / 2, handle: 'w' },
      { x: scaledCrop.x + scaledCrop.width, y: scaledCrop.y + scaledCrop.height / 2, handle: 'e' }
    ];
    
    for (const edge of edges) {
      if (Math.abs(x - edge.x) < threshold && Math.abs(y - edge.y) < threshold) {
        return edge.handle;
      }
    }
    
    // Check if inside crop area (for dragging)
    if (x >= scaledCrop.x && x <= scaledCrop.x + scaledCrop.width &&
        y >= scaledCrop.y && y <= scaledCrop.y + scaledCrop.height) {
      return 'move';
    }
    
    return null;
  };

  const getCursor = (handle) => {
    const cursors = {
      nw: 'nw-resize',
      ne: 'ne-resize',
      sw: 'sw-resize',
      se: 'se-resize',
      n: 'n-resize',
      s: 's-resize',
      e: 'e-resize',
      w: 'w-resize',
      move: 'move'
    };
    return cursors[handle] || 'default';
  };

  const handleMouseDown = (e) => {
    if (!cropArea) return;
    
    const canvas = cropCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;
    
    const imageScale = image.width / canvas.width;
    const handle = getHandleAtPosition(x, y, 1 / imageScale);
    
    if (handle) {
      if (handle === 'move') {
        setIsDragging(true);
      } else {
        setIsResizing(true);
        setResizeHandle(handle);
      }
      setDragStart({ x: x * imageScale, y: y * imageScale, cropArea: { ...cropArea } });
    }
  };

  const handleMouseMove = (e) => {
    const canvas = cropCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;
    const imageScale = image.width / canvas.width;
    
    // Update cursor
    if (!isDragging && !isResizing) {
      const handle = getHandleAtPosition(x, y, 1 / imageScale);
      canvas.style.cursor = handle ? getCursor(handle) : 'default';
    }
    
    if (!isDragging && !isResizing) return;
    if (!dragStart || !cropArea) return;
    
    const currentX = x * imageScale;
    const currentY = y * imageScale;
    const dx = currentX - dragStart.x;
    const dy = currentY - dragStart.y;
    
    if (isDragging) {
      // Move the crop area
      let newX = dragStart.cropArea.x + dx;
      let newY = dragStart.cropArea.y + dy;
      
      // Keep within bounds
      newX = Math.max(0, Math.min(newX, image.width - cropArea.width));
      newY = Math.max(0, Math.min(newY, image.height - cropArea.height));
      
      setCropArea({
        ...cropArea,
        x: newX,
        y: newY
      });
    } else if (isResizing) {
      // Resize the crop area
      let newCrop = { ...dragStart.cropArea };
      
      const aspectRatio = aspectRatioPresets[aspectRatioPreset];
      
      switch (resizeHandle) {
        case 'se':
          newCrop.width = Math.max(50, dragStart.cropArea.width + dx);
          newCrop.height = aspectRatio 
            ? newCrop.width / aspectRatio 
            : Math.max(50, dragStart.cropArea.height + dy);
          break;
        case 'sw':
          newCrop.x = dragStart.cropArea.x + dx;
          newCrop.width = Math.max(50, dragStart.cropArea.width - dx);
          newCrop.height = aspectRatio 
            ? newCrop.width / aspectRatio 
            : Math.max(50, dragStart.cropArea.height + dy);
          break;
        case 'ne':
          newCrop.y = dragStart.cropArea.y + dy;
          newCrop.width = Math.max(50, dragStart.cropArea.width + dx);
          newCrop.height = aspectRatio 
            ? newCrop.width / aspectRatio 
            : Math.max(50, dragStart.cropArea.height - dy);
          break;
        case 'nw':
          newCrop.x = dragStart.cropArea.x + dx;
          newCrop.y = dragStart.cropArea.y + dy;
          newCrop.width = Math.max(50, dragStart.cropArea.width - dx);
          newCrop.height = aspectRatio 
            ? newCrop.width / aspectRatio 
            : Math.max(50, dragStart.cropArea.height - dy);
          break;
        case 'e':
          newCrop.width = Math.max(50, dragStart.cropArea.width + dx);
          if (aspectRatio) {
            newCrop.height = newCrop.width / aspectRatio;
            newCrop.y = dragStart.cropArea.y - (newCrop.height - dragStart.cropArea.height) / 2;
          }
          break;
        case 'w':
          newCrop.x = dragStart.cropArea.x + dx;
          newCrop.width = Math.max(50, dragStart.cropArea.width - dx);
          if (aspectRatio) {
            newCrop.height = newCrop.width / aspectRatio;
            newCrop.y = dragStart.cropArea.y - (newCrop.height - dragStart.cropArea.height) / 2;
          }
          break;
        case 's':
          newCrop.height = Math.max(50, dragStart.cropArea.height + dy);
          if (aspectRatio) {
            newCrop.width = newCrop.height * aspectRatio;
            newCrop.x = dragStart.cropArea.x - (newCrop.width - dragStart.cropArea.width) / 2;
          }
          break;
        case 'n':
          newCrop.y = dragStart.cropArea.y + dy;
          newCrop.height = Math.max(50, dragStart.cropArea.height - dy);
          if (aspectRatio) {
            newCrop.width = newCrop.height * aspectRatio;
            newCrop.x = dragStart.cropArea.x - (newCrop.width - dragStart.cropArea.width) / 2;
          }
          break;
      }
      
      // Keep within bounds
      if (newCrop.x < 0) {
        newCrop.width += newCrop.x;
        newCrop.x = 0;
      }
      if (newCrop.y < 0) {
        newCrop.height += newCrop.y;
        newCrop.y = 0;
      }
      if (newCrop.x + newCrop.width > image.width) {
        newCrop.width = image.width - newCrop.x;
      }
      if (newCrop.y + newCrop.height > image.height) {
        newCrop.height = image.height - newCrop.y;
      }
      
      setCropArea(newCrop);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setDragStart(null);
    setResizeHandle(null);
  };

  const resetCrop = () => {
    if (image) {
      const cropWidth = image.width * 0.8;
      const cropHeight = image.height * 0.8;
      setCropArea({
        x: (image.width - cropWidth) / 2,
        y: (image.height - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight
      });
    }
  };

  const downloadImage = () => {
    let canvas;
    
    if (activeTab === 'crop' && cropArea) {
      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d');
      tempCanvas.width = cropArea.width;
      tempCanvas.height = cropArea.height;
      ctx.drawImage(
        image,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height
      );
      canvas = tempCanvas;
    } else {
      canvas = canvasRef.current;
    }
    
    if (!canvas) return;
    
    const mimeType = outputFormat === 'jpg' ? 'image/jpeg' : `image/${outputFormat}`;
    const qualityValue = quality / 100;
    
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `image-${activeTab}.${outputFormat}`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }, mimeType, qualityValue);
  };

  const reset = () => {
    setImage(null);
    setResizeWidth('');
    setResizeHeight('');
    setCropArea(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <div className="flex-grow p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
              <Maximize2 className="w-10 h-10 text-blue-600" />
              Image Resizer & Crop
            </h1>
            <p className="text-gray-600">Resize and crop images directly in your browser. All processing happens locally.</p>
          </div>

          {/* Main Container */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            {!image ? (
              /* Upload Area */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-4 border-dashed border-blue-300 rounded-xl p-16 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <p className="text-xl font-semibold text-gray-700 mb-2">Click to upload an image</p>
                <p className="text-gray-500">or drag and drop</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('resize')}
                    className={`px-6 py-3 font-semibold transition-all ${
                      activeTab === 'resize'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Maximize2 className="w-5 h-5 inline mr-2" />
                    Resize
                  </button>
                  <button
                    onClick={() => setActiveTab('crop')}
                    className={`px-6 py-3 font-semibold transition-all ${
                      activeTab === 'crop'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Scissors className="w-5 h-5 inline mr-2" />
                    Crop
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Controls Panel */}
                  <div className="space-y-6">
                    {activeTab === 'resize' ? (
                      /* Resize Controls */
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Original Size
                          </label>
                          <p className="text-gray-600">
                            {originalDimensions.width} × {originalDimensions.height} px
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Resize Mode
                          </label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setResizeMode('pixels')}
                              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                                resizeMode === 'pixels'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Pixels
                            </button>
                            <button
                              onClick={() => setResizeMode('percentage')}
                              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                                resizeMode === 'percentage'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Percentage
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="flex items-center gap-2 mb-3">
                            <input
                              type="checkbox"
                              checked={maintainAspect}
                              onChange={(e) => setMaintainAspect(e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-sm font-semibold text-gray-700">
                              Maintain aspect ratio
                            </span>
                          </label>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">
                                Width {resizeMode === 'percentage' ? '(%)' : '(px)'}
                              </label>
                              <input
                                type="number"
                                value={resizeWidth}
                                onChange={(e) => handleResizeWidthChange(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                min="1"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">
                                Height {resizeMode === 'percentage' ? '(%)' : '(px)'}
                              </label>
                              <input
                                type="number"
                                value={resizeHeight}
                                onChange={(e) => handleResizeHeightChange(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                min="1"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>New Size:</strong> {getResizedDimensions().width} × {getResizedDimensions().height} px
                          </p>
                        </div>
                      </>
                    ) : (
                      /* Crop Controls */
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Aspect Ratio Preset
                          </label>
                          <select
                            value={aspectRatioPreset}
                            onChange={(e) => setAspectRatioPreset(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="free">Free</option>
                            <option value="1:1">Square (1:1)</option>
                            <option value="4:3">Landscape (4:3)</option>
                            <option value="16:9">Widescreen (16:9)</option>
                            <option value="3:2">Classic (3:2)</option>
                            <option value="2:3">Portrait (2:3)</option>
                            <option value="9:16">Vertical (9:16)</option>
                          </select>
                        </div>

                        {cropArea && (
                          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                            <p className="text-sm text-blue-800">
                              <strong>Crop Area:</strong>
                            </p>
                            <p className="text-sm text-blue-700">
                              Position: X:{Math.round(cropArea.x)}, Y:{Math.round(cropArea.y)}
                            </p>
                            <p className="text-sm text-blue-700">
                              Size: {Math.round(cropArea.width)} × {Math.round(cropArea.height)} px
                            </p>
                          </div>
                        )}

                        <button
                          onClick={resetCrop}
                          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Reset Crop Area
                        </button>

                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                          <p className="text-sm text-amber-800 flex items-start gap-2">
                            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>
                              <strong>How to crop:</strong><br/>
                              • Drag corners/edges to resize<br/>
                              • Drag center to move<br/>
                              • Grid shows rule of thirds
                            </span>
                          </p>
                        </div>
                      </>
                    )}

                    {/* Output Format */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Output Format
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['png', 'jpg', 'webp'].map((format) => (
                          <button
                            key={format}
                            onClick={() => setOutputFormat(format)}
                            className={`py-2 px-4 rounded-lg font-medium transition-all ${
                              outputFormat === format
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {format.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quality */}
                    {(outputFormat === 'jpg' || outputFormat === 'webp') && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Quality: {quality}%
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={quality}
                          onChange={(e) => setQuality(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={downloadImage}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold"
                      >
                        <Download className="w-5 h-5" />
                        Download
                      </button>
                      <button
                        onClick={reset}
                        className="flex items-center justify-center gap-2 py-3 px-6 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold"
                      >
                        <RotateCcw className="w-5 h-5" />
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Preview Panel */}
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700">
                      Preview
                    </label>
                    <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center min-h-[400px]">
                      {activeTab === 'resize' ? (
                        <canvas
                          ref={canvasRef}
                          className="max-w-full max-h-[600px] object-contain"
                        />
                      ) : (
                        <div ref={cropContainerRef} className="w-full p-4">
                          <canvas
                            ref={cropCanvasRef}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            className="max-w-full max-h-[600px] object-contain mx-auto"
                            style={{ cursor: 'default' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">About Image Resizer & Crop</h2>
            <p className="text-gray-600 mb-6">
              Resize and crop images with precision directly in your browser. All processing happens locally - your images never leave your device.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Features</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Resize by pixels or percentage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Maintain aspect ratio automatically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Advanced crop tool with drag & drop</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Visual crop handles for precise control</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Rule of thirds grid overlay</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Multiple output formats (PNG, JPEG, WebP)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Adjustable quality settings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Real-time preview</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Tips</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">💡</span>
                    <span>Use PNG for images with transparency</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">💡</span>
                    <span>Use JPEG for photographs (smaller file size)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">💡</span>
                    <span>Use WebP for best compression with quality</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">💡</span>
                    <span>Lower quality settings reduce file size</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">💡</span>
                    <span>Use aspect ratio presets for common formats</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">💡</span>
                    <span>Follow the rule of thirds grid for better composition</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Developer Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Creator Info */}
            <div className="text-center md:text-left">
              <p className="text-lg font-semibold mb-1">
                Created by <span className="text-blue-400">Abdul Muqtadir</span>
              </p>
              <p className="text-sm text-gray-400">
                <span className="text-gray-500">@witwebsolutions</span> • Full Stack Developer
              </p>
            </div>
            
            {/* Social Links */}
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/amuqtadir99/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-105 border border-gray-700 hover:border-gray-600"
                title="GitHub Profile"
              >
                <Github className="w-5 h-5" />
                <span className="text-sm font-medium">GitHub</span>
              </a>
              
              <a
                href="https://www.linkedin.com/in/amuqtadir1/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 hover:scale-105 border border-blue-500"
                title="LinkedIn Profile"
              >
                <Linkedin className="w-5 h-5" />
                <span className="text-sm font-medium">LinkedIn</span>
              </a>
              
              <a
                href="https://www.witweb.com.au"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all duration-200 hover:scale-105 border border-indigo-500"
                title="Portfolio Website"
              >
                <Globe className="w-5 h-5" />
                <span className="text-sm font-medium">Portfolio</span>
              </a>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="text-center mt-6 pt-6 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              © 2025 Abdul Muqtadir. Built with React & TailwindCSS • All processing happens locally in your browser
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
