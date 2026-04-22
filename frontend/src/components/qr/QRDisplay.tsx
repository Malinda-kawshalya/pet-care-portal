"use client";

import { useEffect, useState } from "react";
import { Download, QrCode } from "lucide-react";

interface QRDisplayProps {
  petId: string;
  petName: string;
  qrCodeUrl?: string;
  isDownloadable?: boolean;
}

export default function QRDisplay({
  petId,
  petName,
  qrCodeUrl,
  isDownloadable = true,
}: QRDisplayProps) {
  const [qrCode, setQrCode] = useState<string | null>(qrCodeUrl || null);
  const [isLoading, setIsLoading] = useState(!qrCodeUrl);
  const [error, setError] = useState<string | null>(null);

  // Generate QR code if not provided
  useEffect(() => {
    if (!qrCodeUrl && typeof window !== "undefined") {
      const generateQR = async () => {
        try {
          setIsLoading(true);
          const QRCode = (await import("qrcode")).default;
          const qrData = `${window.location.origin}/qr/${petId}`;
          const dataUrl = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel: "H",
            type: "image/png",
            width: 300,
            margin: 1,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          });
          setQrCode(dataUrl);
          setError(null);
        } catch (err) {
          console.error("Error generating QR code:", err);
          setError("Failed to generate QR code");
        } finally {
          setIsLoading(false);
        }
      };

      generateQR();
    }
  }, [petId, qrCodeUrl]);

  const handleDownload = async () => {
    try {
      if (qrCode) {
        const link = document.createElement("a");
        link.href = qrCode;
        link.download = `${petName}-QR-${petId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Error downloading QR code:", err);
      setError("Failed to download QR code");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-blue-100">
        <QrCode className="w-6 h-6 text-blue-600" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Pet QR Code
      </h3>
      <p className="text-sm text-gray-600 text-center mb-4">
        Scan to view {petName}'s profile
      </p>

      {isLoading ? (
        <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center animate-pulse">
          <span className="text-gray-500">Generating QR code...</span>
        </div>
      ) : error ? (
        <div className="w-64 h-64 bg-red-50 rounded-lg flex items-center justify-center border border-red-200">
          <span className="text-red-600 text-sm">{error}</span>
        </div>
      ) : qrCode ? (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <img
            src={qrCode}
            alt={`QR code for ${petName}`}
            className="w-64 h-64"
          />
        </div>
      ) : null}

      {isDownloadable && qrCode && !error && (
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download QR Code
        </button>
      )}
    </div>
  );
}
