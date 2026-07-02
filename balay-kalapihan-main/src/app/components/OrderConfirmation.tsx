import { OrderQRCode } from "./OrderQRCode";

interface OrderConfirmationProps {
  orderNumber: string;
  totalAmount: number;
  paymentMethod: string;
  referenceNumber: string;
  pickupDate: string;
  pickupTime: string;
  onClose: () => void;
}

export function OrderConfirmation({
  orderNumber,
  totalAmount,
  paymentMethod,
  referenceNumber,
  pickupDate,
  pickupTime,
  onClose,
}: OrderConfirmationProps) {
  return (
    <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
      <div className="bg-card rounded-2xl shadow-2xl max-w-lg w-full p-8 border border-border animate-scale-in my-8">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-bounce-in">
            <svg
              className="w-12 h-12 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h3
          className="text-3xl text-center mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Order Confirmed!
        </h3>
        <p className="text-center text-muted-foreground mb-8">
          Your pre-order has been successfully placed
        </p>

        {/* Payment Verification Pending Notice */}
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex gap-2 items-start">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm">
              <p className="font-medium text-blue-700 mb-1">Payment Verification Pending</p>
              <p className="text-blue-600 text-xs">
                Your payment proof has been submitted for verification. Our admin team will review it within 5-10 minutes and update your order status. You'll receive a notification once verified.
              </p>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="mb-8 p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border-2 border-primary/20">
          <OrderQRCode
            orderNumber={orderNumber}
            totalAmount={totalAmount}
            referenceNumber={referenceNumber}
            size={220}
          />
        </div>

        {/* Order Details */}
        <div className="space-y-4 mb-8">
          <div className="p-6 bg-primary/5 border border-primary/20 rounded-xl">
            <div className="text-center mb-3">
              <span className="text-sm text-muted-foreground">
                Order Number
              </span>
              <p
                className="text-2xl text-primary mt-1"
                style={{ fontFamily: "var(--font-display)" }}
              >
                #{orderNumber}
              </p>
            </div>
          </div>

          <div className="space-y-3 p-6 bg-muted/30 rounded-xl">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-muted-foreground">
                Total Amount
              </span>
              <span className="text-xl">
                ₱{totalAmount}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-muted-foreground">
                Payment Method
              </span>
              <span className="font-medium capitalize">
                {paymentMethod}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-muted-foreground">
                Reference No.
              </span>
              <span className="font-mono text-sm">
                {referenceNumber}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">
                Pick-up Schedule
              </span>
              <span className="font-medium">
                {pickupDate} • {pickupTime}
              </span>
            </div>
          </div>

          <div className="p-4 bg-accent/20 border border-accent/30 rounded-lg">
            <div className="flex gap-3">
              <svg
                className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm">
                <p className="font-medium mb-1">
                  Important Reminders:
                </p>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>
                    Please arrive within 15 minutes of your
                    pick-up time
                  </li>
                  <li>
                    Present your order number when collecting
                  </li>
                  <li>
                    Payment will be verified before release
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Track My Order
        </button>

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
          @keyframes bounce-in {
            0% {
              opacity: 0;
              transform: scale(0.3);
            }
            50% {
              transform: scale(1.05);
            }
            70% {
              transform: scale(0.9);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-fade-in {
            animation: fade-in 0.2s ease-out;
          }
          .animate-scale-in {
            animation: scale-in 0.3s ease-out;
          }
          .animate-bounce-in {
            animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          }
        `}</style>
      </div>
    </div>
  );
}