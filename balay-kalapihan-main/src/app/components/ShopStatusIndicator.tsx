import { useState, useEffect } from 'react';

interface ShopStatusIndicatorProps {
  className?: string;
}

interface AdminStatus {
  status: 'open' | 'closed';
  lastChanged: string;
}

export function ShopStatusIndicator({ className = '' }: ShopStatusIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [lastChangedTime, setLastChangedTime] = useState<string>('');

  useEffect(() => {
    const checkShopStatus = () => {
      // Check for admin-set status first
      const adminStatusStr = localStorage.getItem('adminShopStatus');
      if (adminStatusStr) {
        try {
          const adminStatus: AdminStatus = JSON.parse(adminStatusStr);
          const isAdminOpen = adminStatus.status === 'open';
          setIsOpen(isAdminOpen);
          
          const lastChanged = new Date(adminStatus.lastChanged);
          setLastChangedTime(lastChanged.toLocaleTimeString());
          
          if (isAdminOpen) {
            setStatusMessage('Open (Admin)');
          } else {
            setStatusMessage('Closed (Admin)');
          }
          return;
        } catch (e) {
          console.error('Error parsing admin status:', e);
        }
      }

      // Fallback to business hours if no admin override
      const now = new Date();
      const day = now.getDay(); // 0 = Sunday, 6 = Saturday
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const currentTime = hours * 60 + minutes; // Convert to minutes

      // Business hours configuration
      const schedules: { [key: number]: { open: number; close: number } | null } = {
        0: { open: 9 * 60, close: 19 * 60 },     // Sunday: 9 AM - 7 PM
        1: { open: 10 * 60, close: 21 * 60 },    // Monday: 10 AM - 9 PM
        2: { open: 10 * 60, close: 21 * 60 },    // Tuesday: 10 AM - 9 PM
        3: { open: 10 * 60, close: 21 * 60 },    // Wednesday: 10 AM - 9 PM
        4: { open: 10 * 60, close: 21 * 60 },    // Thursday: 10 AM - 9 PM
        5: { open: 10 * 60, close: 21 * 60 },    // Friday: 10 AM - 9 PM
        6: { open: 9 * 60, close: 21 * 60 },     // Saturday: 9 AM - 9 PM
      };

      const todaySchedule = schedules[day];
      
      if (!todaySchedule) {
        setIsOpen(false);
        setStatusMessage('Closed today');
        setLastChangedTime('');
        return;
      }

      const { open, close } = todaySchedule;
      const isCurrentlyOpen = currentTime >= open && currentTime < close;
      setIsOpen(isCurrentlyOpen);
      setLastChangedTime('');

      if (isCurrentlyOpen) {
        // Calculate time until closing
        const minutesUntilClose = close - currentTime;
        if (minutesUntilClose <= 60) {
          setStatusMessage(`Closing in ${minutesUntilClose} min`);
        } else {
          const closeHour = Math.floor(close / 60);
          const closeMin = close % 60;
          const closeTime = `${closeHour > 12 ? closeHour - 12 : closeHour}:${closeMin.toString().padStart(2, '0')} ${closeHour >= 12 ? 'PM' : 'AM'}`;
          setStatusMessage(`Open until ${closeTime}`);
        }
      } else {
        // Calculate time until opening
        let nextOpen = open;
        let nextDay = day;
        
        if (currentTime >= close) {
          // Already closed today, check next day
          nextDay = (day + 1) % 7;
          const nextSchedule = schedules[nextDay];
          if (nextSchedule) {
            nextOpen = nextSchedule.open;
          }
        }

        const openHour = Math.floor(nextOpen / 60);
        const openMin = nextOpen % 60;
        const openTime = `${openHour > 12 ? openHour - 12 : openHour}:${openMin.toString().padStart(2, '0')} ${openHour >= 12 ? 'PM' : 'AM'}`;
        
        if (nextDay === day) {
          setStatusMessage(`Opens at ${openTime}`);
        } else {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          setStatusMessage(`Opens ${dayNames[nextDay]} at ${openTime}`);
        }
      }
    };

    checkShopStatus();
    
    // Check every second for real-time updates from admin changes
    const interval = setInterval(checkShopStatus, 1000);

    // Listen for storage changes from other tabs or admin dashboard
    const handleStorageChange = () => {
      checkShopStatus();
    };
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            isOpen ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {isOpen && (
            <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></div>
          )}
        </div>
      </div>
      <div className="flex flex-col">
        <span className={`text-xs sm:text-sm font-medium ${
          isOpen ? 'text-green-600' : 'text-red-600'
        }`}>
          {isOpen ? 'Open Now' : 'Closed'}
        </span>
        <span className="text-[10px] sm:text-xs text-muted-foreground">
          {statusMessage}
          {lastChangedTime && ` (${lastChangedTime})`}
        </span>
      </div>
    </div>
  );
}
