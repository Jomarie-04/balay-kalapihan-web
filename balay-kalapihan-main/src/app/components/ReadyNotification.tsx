import { useEffect, useState } from 'react';

interface ReadyNotificationProps {
  orderNumber: string;
  onDismiss: () => void;
  onViewOrder: () => void;
}

export function ReadyNotification({
  orderNumber,
  onDismiss,
  onViewOrder,
}: ReadyNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Play a notification sound (optional - using system notification)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Order Ready! 🎉', {
        body: `Your order #${orderNumber} is ready for pickup!`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    }

    // Auto-dismiss after 30 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right max-w-sm">
      <div className="bg-card border-2 border-green-500 rounded-xl shadow-2xl p-4 sm:p-5 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-green-500/5 animate-pulse-slow"></div>
        
        {/* Content */}
        <div className="relative">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center animate-bounce-in">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base sm:text-lg font-medium mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Order Ready! 🎉
              </h4>
              <p className="text-sm text-muted-foreground">
                Your order <span className="font-medium text-foreground">#{orderNumber}</span> is ready for pickup!
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onViewOrder}
              className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all duration-300 text-sm font-medium"
            >
              View Order
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-all duration-300 text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
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

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.5s ease-out;
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
