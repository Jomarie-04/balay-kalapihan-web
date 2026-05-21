import React, { useState } from "react";

interface PaymentModalProps {
  totalAmount: number;
  pickupDate: string;
  pickupTime: string;
  onConfirm: (
    paymentMethod: string,
    referenceNumber: string,
  ) => void;
  onCancel: () => void;
}

export function PaymentModal({
  totalAmount,
  pickupDate,
  pickupTime,
  onConfirm,
  onCancel,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<
    "gcash" | "maya" | null
  >(null);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod) return;

    setIsProcessing(true);
    

    // Generate reference number automatically
    const autoRefNumber = Math.random().toString().slice(2, 15);
    setReferenceNumber(autoRefNumber);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaid(true);
    }, 2000);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMethod && referenceNumber && isPaid) {
      onConfirm(selectedMethod, referenceNumber);
    }
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-border animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3
            className="text-2xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Payment
          </h3>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              Total Amount
            </span>
            <span className="text-3xl text-primary">
              ₱{totalAmount}
            </span>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center text-sm">
            <span className="text-muted-foreground">
              Pick-up schedule
            </span>
            <span className="font-medium break-words">
              {pickupDate} • {pickupTime}
            </span>
          </div>
        </div>

        <form onSubmit={!isPaid ? handlePayNow : handleConfirmPayment}>
          <div className="mb-6">
            <label className="block text-sm mb-3 text-foreground/80">
              Select Payment Method
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedMethod("gcash")}
                className={`p-6 border rounded-xl transition-all duration-300 hover:scale-105 ${
                  selectedMethod === "gcash"
                    ? "border-primary bg-primary/10 shadow-lg"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-[#007DFF] rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      G
                    </span>
                  </div>
                  <span className="font-medium">GCash</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod("maya")}
                className={`p-6 border rounded-xl transition-all duration-300 hover:scale-105 ${
                  selectedMethod === "maya"
                    ? "border-primary bg-primary/10 shadow-lg"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-[#00D632] rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      M
                    </span>
                  </div>
                  <span className="font-medium">Maya</span>
                </div>
              </button>
            </div>
          </div>

          {selectedMethod && (
            <div className="mb-6 animate-slide-down">
              {!isProcessing && !isPaid ? (
                <div className="p-4 bg-accent/20 border border-accent/30 rounded-lg mb-4">
                  <p className="text-sm mb-3 font-medium text-foreground">
                    Payment Summary
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-medium text-foreground">₱{totalAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Method:</span>
                      <span className="font-medium text-foreground uppercase">{selectedMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Recipient:</span>
                      <span className="font-medium text-foreground">Balay Kalapihan</span>
                    </div>
                  </div>
                </div>
              ) : isProcessing ? (
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-4 text-center">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-sm font-medium text-foreground">Processing Payment...</p>
                  <p className="text-xs text-muted-foreground mt-2">Opening {selectedMethod.toUpperCase()} app</p>
                </div>
              ) : (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-green-500">Payment Confirmed!</span>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Reference: <span className="font-mono text-foreground font-medium">{referenceNumber}</span></p>
                    <p>Amount: <span className="font-medium text-foreground">₱{totalAmount}</span></p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-all duration-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedMethod}
              className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Processing...
                </span>
              ) : isPaid ? (
                "Complete Order"
              ) : (
                `Pay ₱${totalAmount} via ${selectedMethod?.toUpperCase()}`
              )}
            </button>
          </div>
        </form>

        <style>{`
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scale-in {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes slide-down {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in {
            animation: fade-in 0.2s ease-out;
          }
          .animate-scale-in {
            animation: scale-in 0.3s ease-out;
          }
          .animate-slide-down {
            animation: slide-down 0.3s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
}