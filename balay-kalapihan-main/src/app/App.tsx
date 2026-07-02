import { useState, useEffect } from "react";
import { CustomerLogin, CustomerUserData } from "./components/CustomerLogin";
import { AdminLogin, AdminUserData } from "./components/AdminLogin";
import { PortalSelector } from "./components/PortalSelector";
import { Dashboard } from "./components/Dashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { api } from "../services/api";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes for admin, 60 minutes for users
const ADMIN_SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes for admin
const USER_SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes for regular users
const INACTIVITY_WARNING_MS = SESSION_TIMEOUT_MS - 5 * 60 * 1000; // Warning 5 minutes before logout

export interface UserData {
  id?: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  isAdmin?: boolean;
}

export default function App() {
  const [user, setUser] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedPortal, setSelectedPortal] = useState<'customer' | 'admin' | null>(null);
  const [loginTime, setLoginTime] = useState<number | null>(null);
  const [lastActivityTime, setLastActivityTime] = useState<number | null>(null);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(0);

  // Restore session on app load (both admin and user)
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken) {
      api.setToken(adminToken);
      // Set user to admin so AdminDashboard is shown
      setUser("admin");
      setSelectedPortal("admin");
      setUserData({
        id: 999,
        username: "admin",
        email: "admin@balaykalapihan.com",
        fullName: "Administrator",
        isAdmin: true,
      });
      setLoginTime(Date.now());
      setLastActivityTime(Date.now());
      return;
    }

    // Restore regular user session
    const userToken = localStorage.getItem("userToken");
    const storedUserData = localStorage.getItem("userData");
    if (userToken && storedUserData) {
      api.setToken(userToken);
      const userData = JSON.parse(storedUserData);
      setUser(userData.username);
      setSelectedPortal("customer");
      setUserData(userData);
      setLoginTime(Date.now());
      setLastActivityTime(Date.now());
    }
  }, []);

  // Track user activity
  useEffect(() => {
    const handleUserActivity = () => {
      if (user) {
        setLastActivityTime(Date.now());
        setShowSessionWarning(false);
      }
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [user]);

  // Monitor session timeout
  useEffect(() => {
    if (!user || !loginTime || !lastActivityTime) return;

    const timeout = setInterval(() => {
      const now = Date.now();
      const sessionDuration = user === "admin" ? ADMIN_SESSION_TIMEOUT_MS : USER_SESSION_TIMEOUT_MS;
      const timeSinceLastActivity = now - lastActivityTime;
      const timeRemaining = sessionDuration - timeSinceLastActivity;

      if (timeSinceLastActivity >= sessionDuration) {
        // Session expired - auto-logout
        handleLogout();
        alert(`Your session has expired due to inactivity. Please login again.`);
      } else if (timeRemaining <= 5 * 60 * 1000 && timeRemaining > 0) {
        // Show warning when less than 5 minutes remaining
        setShowSessionWarning(true);
        setSessionTimeRemaining(Math.ceil(timeRemaining / 1000));
      } else {
        setShowSessionWarning(false);
      }
    }, 1000);

    return () => clearInterval(timeout);
  }, [user, loginTime, lastActivityTime]);

  const handleCustomerLogin = (username: string, data: CustomerUserData) => {
    const now = Date.now();
    setUser(username);
    setUserData({
      ...data,
      isAdmin: false,
    });
    setLoginTime(now);
    setLastActivityTime(now);
  };

  const handleAdminLogin = (data: AdminUserData) => {
    const now = Date.now();
    setUser("admin");
    setUserData({
      ...data,
      isAdmin: true,
    });
    setLoginTime(now);
    setLastActivityTime(now);
    
    // Store login session info for security tracking
    const adminSessions = JSON.parse(
      localStorage.getItem("adminSessions") || "[]"
    );
    adminSessions.push({
      loginTime: now,
      loginDate: new Date(now).toLocaleString(),
      sessionDuration: ADMIN_SESSION_TIMEOUT_MS,
    });
    
    // Keep only last 10 sessions
    if (adminSessions.length > 10) {
      adminSessions.shift();
    }
    
    localStorage.setItem("adminSessions", JSON.stringify(adminSessions));
  };

  const handleLogout = () => {
    // Clear admin session data on logout
    if (user === "admin") {
      // Log the logout for audit purposes
      const adminAudit = JSON.parse(
        localStorage.getItem("adminAuditLog") || "[]"
      );
      adminAudit.push({
        action: "logout",
        timestamp: Date.now(),
        sessionDuration: loginTime ? Date.now() - loginTime : 0,
      });
      
      // Keep only last 50 audit entries
      if (adminAudit.length > 50) {
        adminAudit.shift();
      }
      
      localStorage.setItem("adminAuditLog", JSON.stringify(adminAudit));
      // Clear the admin token
      localStorage.removeItem("adminToken");
    } else {
      // Clear regular user session data
      localStorage.removeItem("userToken");
      localStorage.removeItem("userData");
    }
    
    // Clear API token
    api.setToken(null);
    
    setUser(null);
    setUserData(null);
    setLoginTime(null);
    setLastActivityTime(null);
    setShowSessionWarning(false);
  };

  // Check if user is admin
  const isAdmin = user === "admin" && userData?.isAdmin;

  const handleBackToPortalSelect = () => {
    setSelectedPortal(null);
  };

  return (
    <div className="size-full">
      {/* Show Portal Selector if no portal is selected */}
      {!selectedPortal && (
        <PortalSelector onSelectPortal={setSelectedPortal} />
      )}

      {/* Show Login Forms if portal is selected but not logged in */}
      {selectedPortal && !user && userData === null ? (
        <>
          {selectedPortal === "customer" ? (
            <CustomerLogin 
              onLogin={handleCustomerLogin}
              onBackToPortalSelect={handleBackToPortalSelect}
            />
          ) : (
            <AdminLogin 
              onLogin={handleAdminLogin}
              onBackToPortalSelect={handleBackToPortalSelect}
            />
          )}
        </>
      ) : null}

      {/* Show Dashboards if logged in */}
      {user && userData ? (
        <>
          {/* Session Warning Modal */}
          {showSessionWarning && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-card rounded-lg p-6 max-w-sm mx-4 shadow-xl border border-border">
                <h3 className="text-lg font-semibold mb-2 text-destructive">Session Expiring Soon</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your session will expire in <span className="font-semibold text-destructive">{sessionTimeRemaining}</span> seconds due to inactivity.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleLogout}
                    className="flex-1 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm"
                  >
                    Logout
                  </button>
                  <button
                    onClick={() => setShowSessionWarning(false)}
                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {isAdmin ? (
            <AdminDashboard onLogout={handleLogout} />
          ) : (
            <Dashboard
              username={user}
              userData={userData}
              onLogout={handleLogout}
              onUpdateUserData={setUserData}
            />
          )}
        </>
      ) : null}
    </div>
  );
}