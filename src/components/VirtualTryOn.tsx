import React, { useEffect, useRef, useState } from 'react';
import { initPoseModel, calculateGarmentTransform } from '../utils/aiEngine';
import { Camera } from '@mediapipe/camera_utils';

const VirtualTryOn: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedGarment, setSelectedGarment] = useState<string>('/assets/garments/shirt1.png');
  const [isProcessing, setIsProcessing] = useState(false);

  // Load garment image
  const garmentImg = useRef<HTMLImageElement>(new Image());

  useEffect(() => {
    garmentImg.current.src = selectedGarment;
  }, [selectedGarment]);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const pose = initPoseModel();
    const canvasCtx = canvasRef.current.getContext('2d');

    const onResults = (results: any) => {
      if (!canvasCtx || !canvasRef.current) return;
      
      // 1. Clear and Draw Camera Feed
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // Optional: Apply Segmentation Mask if needed (Chapter 4.2)
      // canvasCtx.globalCompositeOperation = 'source-in'; 
      
      canvasCtx.drawImage(
        results.image, 0, 0, canvasRef.current.width, canvasRef.current.height
      );

      // 2. Garment Alignment Module 
      if (results.poseLandmarks) {
        const transform = calculateGarmentTransform(
          results.poseLandmarks, 
          canvasRef.current.width, 
          canvasRef.current.height
        );

        if (transform) {
          canvasCtx.translate(transform.x, transform.y);
          canvasCtx.rotate(transform.rotation);
          
          // Draw the Virtual Garment
          canvasCtx.drawImage(
            garmentImg.current,
            -transform.width / 2, // Center horizontally
            -transform.height / 5, // Offset vertically to sit on shoulders
            transform.width,
            transform.height
          );
          
          canvasCtx.rotate(-transform.rotation);
          canvasCtx.translate(-transform.x, -transform.y);
        }
      }
      canvasCtx.restore();
    };

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await pose.send({ image: videoRef.current! });
      },
      width: 1280,
      height: 720,
    });

    camera.start();
    setIsProcessing(true);

    return () => { camera.stop(); };
  }, [selectedGarment]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <h2 className="text-2xl font-bold p-4 text-center">Real-Time Virtual Fitting Room</h2>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Render Area */}
        <div className="flex-1 relative flex justify-center items-center bg-black">
          <video ref={videoRef} className="hidden" /> {/* Hidden raw feed */}
          <canvas 
            ref={canvasRef} 
            width={1280} 
            height={720} 
            className="w-full h-full object-contain"
          />
          {!isProcessing && <div className="absolute text-xl">Loading AI Models...</div>}
        </div>

        {/* User Interaction Module [cite: 358] */}
        <div className="w-64 bg-gray-800 p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Select Outfit</h3>
          <div className="grid grid-cols-2 gap-2">
            {['shirt1.png', 'tshirt_red.png', 'jacket.png'].map((item) => (
              <button 
                key={item}
                onClick={() => setSelectedGarment(`/assets/garments/${item}`)}
                className={`p-2 border rounded ${selectedGarment.includes(item) ? 'border-blue-500 bg-blue-900' : 'border-gray-600'}`}
              >
                <img src={`/assets/garments/${item}`} alt="garment" className="w-full" />
                <p className="text-xs mt-1 truncate">{item}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualTryOn;