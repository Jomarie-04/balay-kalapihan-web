import React, { useState } from "react";

interface ChangePasswordModalProps {
  username: string;
  // onPasswordChange: () => void; // Optional: callback for parent component
  onClose: () => void;
}

export function ChangePasswordModal({
  username,
  onClose,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Get user data from localStorage
    const users = JSON.parse(
      localStorage.getItem("balayKalapihanUsers") || "{}",
    );
    const userData = users[username];

    if (!userData || userData.password !== currentPassword) {
      setError("Current password is incorrect");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    // Update password
    users[username].password = newPassword;
    localStorage.setItem(
      "balayKalapihanUsers",
      JSON.stringify(users),
    );

    setSuccess(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-border animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3
            className="text-xl sm:text-2xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Change Password
          </h3>
          <button
            onClick={onClose}
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

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-primary"
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
            <p className="text-lg text-primary">
              Password changed successfully!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-sm text-destructive">
                  {error}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="current-password"
                className="block text-sm text-foreground/80"
              >
                Current Password
              </label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) =>
                  setCurrentPassword(e.target.value)
                }
                className="w-full px-4 py-2.5 sm:py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 text-sm sm:text-base"
                placeholder="Enter current password"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="new-password"
                className="block text-sm text-foreground/80"
              >
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 sm:py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 text-sm sm:text-base"
                placeholder="Enter new password"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirm-new-password"
                className="block text-sm text-foreground/80"
              >
                Confirm New Password
              </label>
              <input
                id="confirm-new-password"
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                className="w-full px-4 py-2.5 sm:py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 text-sm sm:text-base"
                placeholder="Confirm new password"
                required
                minLength={6}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-2.5 sm:py-3 border border-border rounded-lg hover:bg-muted transition-all duration-300 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground py-2.5 sm:py-3 rounded-lg hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Update Password
              </button>
            </div>
          </form>
        )}

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