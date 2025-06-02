import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import QrScanner from 'qr-scanner';

const QRScanner = ({ isOpen, onClose, onScan, eventId }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [hasCamera, setHasCamera] = useState(true);
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      startScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const startScanning = async () => {
    try {
      setError(null);
      setScanning(true);

      // Check if camera is available
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        setHasCamera(false);
        setError('No camera found on this device');
        return;
      }

      // Create QR scanner instance
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => handleScanResult(result.data),
        {
          onDecodeError: (error) => {
            // Ignore decode errors - they happen when no QR code is visible
            console.debug('QR decode error:', error);
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment', // Use back camera if available
        }
      );

      await qrScannerRef.current.start();
      setScanning(true);
    } catch (err) {
      console.error('Failed to start QR scanner:', err);
      setError('Failed to access camera. Please check permissions.');
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setScanning(false);
  };

  const handleScanResult = (qrData) => {
    try {
      // Validate QR code data
      const parsedData = JSON.parse(qrData);
      
      // Check if it's an event attendance QR code
      if (parsedData.type !== 'event_attendance') {
        setError('Invalid QR code. Please scan an event attendance QR code.');
        return;
      }

      // Check if QR code is for the current event
      if (parsedData.eventId !== eventId) {
        setError('This QR code is for a different event.');
        return;
      }

      // Stop scanning and call the onScan callback
      stopScanning();
      onScan(qrData);
      onClose();
    } catch (err) {
      console.error('Failed to parse QR code:', err);
      setError('Invalid QR code format. Please scan a valid event QR code.');
    }
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Scan QR Code</h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scanner Content */}
        <div className="p-4">
          {error ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={startScanning} disabled={!hasCamera}>
                  <Camera className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Camera View */}
              <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  playsInline
                  muted
                />
                {!scanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="text-white text-center">
                      <Camera className="h-12 w-12 mx-auto mb-2" />
                      <p>Starting camera...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="text-center text-gray-600 mb-4">
                <p className="text-sm">
                  Position the QR code within the camera view to scan
                </p>
              </div>

              {/* Controls */}
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                {!scanning && (
                  <Button onClick={startScanning}>
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner; 