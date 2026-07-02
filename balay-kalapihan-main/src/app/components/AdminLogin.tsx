import { useState, useEffect } from "react";
import { api } from "../../services/api";

interface AdminLoginProps {
  onLogin: (userData: AdminUserData) => void;
  onBackToPortalSelect: () => void;
}

export interface AdminUserData {
  id: number;
  username: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
}

interface AdminSecurity {
  lockedUntil?: number;
  failedAttempts: number;
  lastAttempt?: number;
  loginHistory: Array<{ timestamp: number; ip?: string }>;
}

export function AdminLogin({ onLogin, onBackToPortalSelect }: AdminLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAccountLocked, setIsAccountLocked] = useState(false);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Check for account lockout on component mount and username change
  useEffect(() => {
    if (username === "admin") {
      checkAdminLockout();
    }
  }, [username]);

  // Update lockout timer
  useEffect(() => {
    if (!isAccountLocked) return;

    const interval = setInterval(() => {
      const security = getAdminSecurity();
      const now = Date.now();

      if (security.lockedUntil && security.lockedUntil > now) {
        const remaining = Math.ceil((security.lockedUntil - now) / 1000);
        setLockoutTimeRemaining(remaining);
      } else {
        setIsAccountLocked(false);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isAccountLocked]);

  const getAdminSecurity = (): AdminSecurity => {
    const stored = localStorage.getItem("adminSecurityLog");
    return stored
      ? JSON.parse(stored)
      : {
          failedAttempts: 0,
          loginHistory: [],
        };
  };

  const saveAdminSecurity = (security: AdminSecurity) => {
    localStorage.setItem("adminSecurityLog", JSON.stringify(security));
  };

  const checkAdminLockout = () => {
    const security = getAdminSecurity();
    const now = Date.now();

    if (security.lockedUntil && security.lockedUntil > now) {
      setIsAccountLocked(true);
      setLoginError(
        `Admin account is locked. Try again in ${Math.ceil(
          (security.lockedUntil - now) / 1000
        )} seconds.`
      );
      return true;
    }

    if (security.lockedUntil && security.lockedUntil <= now) {
      // Unlock and reset
      security.failedAttempts = 0;
      security.lockedUntil = undefined;
      saveAdminSecurity(security);
      setIsAccountLocked(false);
    }

    return false;
  };

  const recordLoginAttempt = (success: boolean) => {
    const security = getAdminSecurity();
    const now = Date.now();

    // Store detailed login attempt in history
    const loginAttemptHistory = JSON.parse(localStorage.getItem("loginAttemptHistory") || "[]");
    loginAttemptHistory.push({
      timestamp: now,
      status: success ? 'success' : 'failed',
      date: new Date(now).toLocaleString(),
      username: 'admin'
    });
    // Keep last 100 attempts
    if (loginAttemptHistory.length > 100) {
      loginAttemptHistory.shift();
    }
    localStorage.setItem("loginAttemptHistory", JSON.stringify(loginAttemptHistory));

    security.loginHistory = security.loginHistory.filter(
      (attempt) => now - attempt.timestamp < 24 * 60 * 60 * 1000 // Keep last 24 hours
    );

    if (success) {
      // Reset failed attempts on successful login
      security.failedAttempts = 0;
      security.lockedUntil = undefined;
      security.loginHistory.push({ timestamp: now });
      saveAdminSecurity(security);
    } else {
      // Increment failed attempts
      security.failedAttempts++;
      security.lastAttempt = now;
      security.loginHistory.push({ timestamp: now });

      // Lock account after 5 failed attempts
      const MAX_ATTEMPTS = 5;
      const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

      if (security.failedAttempts >= MAX_ATTEMPTS) {
        security.lockedUntil = now + LOCKOUT_DURATION;
        setIsAccountLocked(true);
        setLoginError(
          `Admin account locked due to too many failed login attempts. Try again in 15 minutes.`
        );
      } else {
        const remaining = MAX_ATTEMPTS - security.failedAttempts;
        setLoginError(
          `Invalid credentials. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining before account lockout.`
        );
      }

      saveAdminSecurity(security);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoading(true);

    try {
      if (!username || !password) {
        setLoginError("Please fill in all fields");
        setIsLoading(false);
        return;
      }

      // Only allow admin username
      if (username !== "admin") {
        setLoginError("Invalid admin credentials");
        setIsLoading(false);
        return;
      }

      // Check if account is locked
      if (checkAdminLockout()) {
        setIsLoading(false);
        return;
      }

      // Hardcoded admin credentials for now - in production, this should be in backend
      if (password === "admin123") {
        recordLoginAttempt(true);

        // Try to login via backend
        try {
          const response: any = await api.login("admin", "admin123");
          if (response.token) {
            api.setToken(response.token);
            localStorage.setItem("adminToken", response.token);

            onLogin({
              id: 999,
              username: "admin",
              email: "admin@balaykalapihan.com",
              fullName: "Administrator",
              isAdmin: true,
            });
            return;
          }
        } catch (error) {
          console.error("Backend admin login failed, using local fallback:", error);
        }

        // Fallback: Use a marker token for localStorage-based menu updates
        // Backend is required for API calls, but localStorage fallback is available
        const fallbackToken = 'admin-fallback-' + Date.now();
        api.setToken(fallbackToken);
        localStorage.setItem("adminToken", fallbackToken);
        console.warn('⚠️  Backend unreachable - login succeeded locally. Product status updates may require backend to be running.');

        onLogin({
          id: 999,
          username: "admin",
          email: "admin@balaykalapihan.com",
          fullName: "Administrator",
          isAdmin: true,
        });
      } else {
        recordLoginAttempt(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden"
      style={{
        backgroundImage: 'url("/images/balay-kalapihan.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dark overlay for better readability */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12 animate-fade-in">
          <div className="inline-block mb-4 relative">
            <div className="absolute inset-0 blur-xl opacity-30 bg-orange-500 rounded-full"></div>
            <div className="relative rounded-full p-2 sm:p-3 shadow-lg bg-orange-600/20 border border-orange-500">
              <svg
                className="w-16 h-16 sm:w-20 sm:h-20 text-orange-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </div>
          </div>
          <h1
            className="text-3xl sm:text-4xl md:text-5xl mb-3 text-white"
            style={{ fontFamily: "var(--font-script)" }}
          >
            Balay Kalapihan
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground tracking-wide">
            Admin Dashboard Access
          </p>
          <p className="text-xs text-orange-400 mt-2 font-semibold">⚠️ Admin Portal - Restricted Access</p>
        </div>

        {/* Admin Login Card */}
        <div className="bg-card rounded-2xl shadow-2xl p-6 sm:p-8 border border-orange-500/30 backdrop-blur-sm animate-slide-up">
          <h2
            className="text-2xl sm:text-3xl mb-2 text-center"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Admin Login
          </h2>
          <p className="text-center text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base">
            Enter admin credentials to access the dashboard
          </p>

          {/* Error Message Display */}
          {loginError && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg animate-slide-down">
              <p className="text-sm text-center text-destructive">{loginError}</p>
              {isAccountLocked && lockoutTimeRemaining > 0 && (
                <p className="text-xs text-center text-destructive/80 mt-2">
                  Account will unlock in: {lockoutTimeRemaining}s
                </p>
              )}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
            <div className="space-y-2">
              <label htmlFor="admin-username" className="block text-sm text-foreground/80">
                Admin Username
              </label>
              <input
                id="admin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 sm:py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all duration-300 hover:border-orange-500/30 text-sm sm:text-base"
                placeholder="Enter admin username"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="admin-password" className="block text-sm text-foreground/80">
                Admin Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 sm:py-3 pr-12 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all duration-300 hover:border-orange-500/30 text-sm sm:text-base"
                  placeholder="Enter admin password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  {showPassword ? (
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
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  ) : (
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAccountLocked || isLoading}
              className="w-full bg-orange-600 text-white py-2.5 sm:py-3 rounded-lg hover:bg-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {isLoading
                ? "Logging in..."
                : isAccountLocked
                  ? `Locked (${lockoutTimeRemaining}s)`
                  : "Admin Login"}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-3 sm:p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <p className="text-xs text-orange-600/80 text-center">
              ⚠️ This is a restricted admin portal. All login attempts are logged for security purposes.
            </p>
          </div>

          {/* Back to Portal Selection Button */}
          <button
            type="button"
            onClick={onBackToPortalSelect}
            disabled={isLoading}
            className="w-full mt-6 pt-6 border-t border-border text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            ← Back to Portal Selection
          </button>
        </div>
      </div>
    </div>
  );
}
