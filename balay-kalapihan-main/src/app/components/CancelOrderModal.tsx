import { useState, useEffect } from 'react';

interface CancelOrderModalProps {
  orderNumber: string;
  timeRemaining: number; // in seconds
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export function CancelOrderModal({
  orderNumber,
  timeRemaining,
  onConfirm,
  onCancel,
}: CancelOrderModalProps) {
  const [reason, setReason] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localTimeRemaining, setLocalTimeRemaining] = useState(timeRemaining);

  // Update countdown timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setLocalTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleConfirm = async () => {
    setIsConfirming(true);
    setError(null);
    try {
      // Properly await the async onConfirm function
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order. Please try again.');
      setIsConfirming(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-border animate-scale-in">
        {/* Warning Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        <h3 className="text-xl sm:text-2xl text-center mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Cancel Order?
        </h3>
        <p className="text-center text-muted-foreground mb-6">
          Are you sure you want to cancel order #{orderNumber}?
        </p>

        {/* Time Remaining */}
        <div className="mb-6 p-4 bg-accent/20 border border-accent/30 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Time remaining to cancel:</span>
            <span className="text-lg font-medium text-accent" style={{ fontFamily: 'var(--font-display)' }}>
              {formatTime(localTimeRemaining)}
            </span>
          </div>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-1000"
              style={{ width: `${(localTimeRemaining / 300) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Reason (Optional) */}
        <div className="mb-6">
          <label htmlFor="cancel-reason" className="block text-sm text-foreground/80 mb-2">
            Reason for cancellation (optional)
          </label>
          <textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 resize-none text-sm"
            placeholder="Let us know why you're cancelling..."
            rows={3}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-destructive/20 border border-destructive/40 rounded-lg">
            <p className="text-sm text-destructive">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {/* Warning Message */}
        <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">
            <strong>Note:</strong> Once cancelled, this action cannot be undone. Your payment will be refunded within 3-5 business days.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Keep Order
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isConfirming}
            className="flex-1 bg-destructive text-destructive-foreground py-3 rounded-lg hover:bg-destructive/90 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {isConfirming ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Cancelling...
              </>
            ) : (
              'Cancel Order'
            )}
          </button>
        </div>

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
          .animate-fade-in {
            animation: fade-in 0.2s ease-out;
          }
          .animate-scale-in {
            animation: scale-in 0.3s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
}
