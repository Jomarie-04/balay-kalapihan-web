import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface OrderQRCodeProps {
  orderNumber: string;
  totalAmount: number;
  referenceNumber: string;
  size?: number;
}

export function OrderQRCode({
  orderNumber,
  totalAmount,
  referenceNumber,
  size = 200,
}: OrderQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const qrData = JSON.stringify({
        orderNumber,
        totalAmount,
        referenceNumber,
        timestamp: new Date().toISOString(),
      });

      QRCode.toCanvas(
        canvasRef.current,
        qrData,
        {
          width: size,
          margin: 2,
          color: {
            dark: "#3E2723",
            light: "#FFFFFF",
          },
        },
        (error) => {
          if (error)
            console.error("QR Code generation error:", error);
        },
      );
    }
  }, [orderNumber, totalAmount, referenceNumber, size]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white p-4 rounded-xl shadow-lg border-4 border-primary/20">
        <canvas ref={canvasRef} className="block" />
      </div>
      <p className="text-sm text-muted-foreground text-center">
        Scan this QR code at pickup counter
      </p>
    </div>
  );
}