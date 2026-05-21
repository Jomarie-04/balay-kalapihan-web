import { useState, useRef, useEffect } from "react";
import { UserData } from "./Login";

interface ProfileMenuProps {
  userData: UserData;
  onLogout: () => void;
  onAccountSettings: () => void;
  onProfile?: () => void;
  onPayments?: () => void;
}

export function ProfileMenu({
  userData,
  onLogout,
  onAccountSettings,
  onProfile,
  onPayments,
}: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-full hover:bg-muted transition-all duration-300 hover:scale-105 active:scale-95"
      >
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium text-sm sm:text-base">
          {getInitials(userData.fullName)}
        </div>
        <svg
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 hidden sm:block ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-[18rem] sm:max-w-[20rem] bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-scale-in z-50 max-h-[80vh] overflow-y-auto">
          {/* User Info Section */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-primary/5 to-primary/10 border-b border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium text-lg">
                {getInitials(userData.fullName)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate text-sm sm:text-base">
                  {userData.fullName}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  @{userData.username}
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {userData.email}
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => {
                setIsOpen(false);
                onProfile?.();
              }}
              className="w-full px-4 sm:px-5 py-3 flex items-center gap-3 hover:bg-muted transition-colors text-left"
            >
              <svg
                className="w-5 h-5 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="text-sm sm:text-base">
                Profile
              </span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onAccountSettings();
              }}
              className="w-full px-4 sm:px-5 py-3 flex items-center gap-3 hover:bg-muted transition-colors text-left"
            >
              <svg
                className="w-5 h-5 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-sm sm:text-base">
                Account Settings
              </span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onPayments?.();
              }}
              className="w-full px-4 sm:px-5 py-3 flex items-center gap-3 hover:bg-muted transition-colors text-left"
            >
              <svg
                className="w-5 h-5 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h.01M11 15h.01M15 15h.01M7 19h.01M11 19h.01M15 19h.01M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
                />
              </svg>
              <span className="text-sm sm:text-base">
                Payments
              </span>
            </button>

            <div className="my-2 border-t border-border"></div>

            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full px-4 sm:px-5 py-3 flex items-center gap-3 hover:bg-destructive/10 text-destructive transition-colors text-left"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="text-sm sm:text-base">
                Logout
              </span>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}