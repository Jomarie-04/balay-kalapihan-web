import React, { useState, useRef } from "react";
import { validatePaymentData } from '../../services/paymentVerification';

interface PaymentModalProps {
  totalAmount: number;
  pickupDate: string;
  pickupTime: string;
  onConfirm: (
    paymentMethod: string,
    referenceNumber: string,
    proofFile?: File,
  ) => void;
  onCancel: () => void;
}

// GCash and Maya account details for QR code generation
const PAYMENT_ACCOUNTS = {
  gcash: {
    name: "Balay Kalapihan",
    number: "09975407609",
    qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=gcash://09975407609/BalayKalapihan",
  },
  maya: {
    name: "Balay Kalapihan",
    number: "09975407609",
    qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=maya://09975407609/BalayKalapihan",
  },
};

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
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setProofFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setProofPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod || !referenceNumber || !proofFile) {
      alert("Please complete all fields and upload proof of payment");
      return;
    }

    setIsSubmitting(true);
    try {
      onConfirm(selectedMethod, referenceNumber, proofFile);
    } catch (error) {
      console.error("Payment submission error:", error);
      alert("Failed to submit payment for verification");
      setIsSubmitting(false);
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
            Manual Payment
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

        <form onSubmit={handleSubmitPayment}>
          {/* Payment Method Selection */}
          <div className="mb-6">
            <label className="block text-sm mb-3 text-foreground/80 font-medium">
              Step 1: Select Payment Method
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
            <div className="mb-6 space-y-4 animate-slide-down">
              {/* Step 2: QR Code and Account Details */}
              <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
                <p className="text-sm font-medium text-foreground mb-3">
                  Step 2: Scan QR Code or Send to:
                </p>
                
                {/* QR Code */}
                <div className="flex justify-center mb-4 p-3 bg-white rounded-lg">
                  <img 
                    src={PAYMENT_ACCOUNTS[selectedMethod].qrCode}
                    alt={`${selectedMethod.toUpperCase()} QR Code`}
                    className="w-40 h-40"
                  />
                </div>

                {/* Account Details */}
                <div className="bg-muted/50 rounded-lg p-3 text-center text-sm">
                  <p className="text-muted-foreground mb-1">Recipient</p>
                  <p className="font-semibold text-foreground mb-2">
                    {PAYMENT_ACCOUNTS[selectedMethod].name}
                  </p>
                  <p className="text-muted-foreground mb-1">Account Number</p>
                  <p className="font-mono font-bold text-accent text-lg">
                    {PAYMENT_ACCOUNTS[selectedMethod].number}
                  </p>
                  <p className="text-muted-foreground text-xs mt-2">
                    Amount: ₱{totalAmount}
                  </p>
                </div>
              </div>

              {/* Step 3: Reference Number */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Step 3: Enter Reference Number
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value.toUpperCase())}
                  placeholder="Enter transaction reference (optional)"
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  From your {selectedMethod.toUpperCase()} receipt or transaction details
                </p>
              </div>

              {/* Step 4: Upload Proof of Payment */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Step 4: Upload Proof of Payment
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-primary/30 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  {proofPreview ? (
                    <div className="space-y-2">
                      <img 
                        src={proofPreview} 
                        alt="Proof preview"
                        className="w-32 h-32 object-cover rounded-lg mx-auto"
                      />
                      <p className="text-sm font-medium text-foreground">
                        {proofFile?.name}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProofFile(null);
                          setProofPreview("");
                        }}
                        className="text-xs text-destructive hover:text-destructive/80"
                      >
                        Change image
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <svg
                        className="w-8 h-8 mx-auto text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <div className="text-sm">
                        <p className="text-foreground font-medium">Click to upload screenshot</p>
                        <p className="text-muted-foreground text-xs">or drag and drop</p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload a screenshot of your payment confirmation
                </p>
              </div>

              {/* Status Message */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-700 font-medium">
                  ℹ️ Your payment will be verified by our admin team within 5-10 minutes
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-all duration-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedMethod || !referenceNumber || !proofFile || isSubmitting}
              className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Submitting...
                </span>
              ) : (
                "Submit for Verification"
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