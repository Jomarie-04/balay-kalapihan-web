import React, { useMemo, useState } from "react";
import { UserData } from "./Login";
import { api } from "../../services/api";

interface EditInfoModalProps {
  username: string;
  userData: UserData;
  onSave: (updatedUserData: UserData) => void;
  onClose: () => void;
}

export function EditInfoModal({
  username,
  userData,
  onSave,
  onClose,
}: EditInfoModalProps) {
  const initial = useMemo(
    () => ({
      fullName: userData.fullName ?? "",
      email: userData.email ?? "",
      phoneNumber: userData.phoneNumber ?? "",
    }),
    [userData.email, userData.fullName, userData.phoneNumber],
  );

  const [fullName, setFullName] = useState(initial.fullName);
  const [email, setEmail] = useState(initial.email);
  const [phoneNumber, setPhoneNumber] = useState(initial.phoneNumber);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Full name is required");
      return;
    }

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!phoneNumber.trim()) {
      setError("Phone number is required");
      return;
    }

    // Try to update via backend API first
    api.updateProfile(email.trim(), fullName.trim(), phoneNumber.trim())
      .then(() => {
        // Also update localStorage as fallback
        const users = JSON.parse(
          localStorage.getItem("balayKalapihanUsers") || "{}",
        );
        const existing = users[username];
        if (existing) {
          users[username] = {
            ...existing,
            fullName: fullName.trim(),
            email: email.trim(),
            phoneNumber: phoneNumber.trim(),
          };
          localStorage.setItem(
            "balayKalapihanUsers",
            JSON.stringify(users),
          );
        }

        setSuccess(true);
        onSave({
          ...userData,
          fullName: fullName.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim(),
        });
        setTimeout(() => onClose(), 800);
      })
      .catch((error) => {
        console.log('Backend update failed, using localStorage:', error);
        
        // Fallback to localStorage only
        const users = JSON.parse(
          localStorage.getItem("balayKalapihanUsers") || "{}",
        );
        const existing = users[username];
        if (!existing) {
          setError("User account not found");
          return;
        }

        users[username] = {
          ...existing,
          fullName: fullName.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim(),
        };
        localStorage.setItem(
          "balayKalapihanUsers",
          JSON.stringify(users),
        );

        setSuccess(true);
        onSave({
          ...userData,
          fullName: fullName.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim(),
        });
        setTimeout(() => onClose(), 800);
      });
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-border animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3
            className="text-xl sm:text-2xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Edit Information
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
            <p className="text-lg text-primary">Saved!</p>
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
                htmlFor="edit-fullname"
                className="block text-sm text-foreground/80"
              >
                Full Name
              </label>
              <input
                id="edit-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 sm:py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 text-sm sm:text-base"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="edit-email"
                className="block text-sm text-foreground/80"
              >
                Email
              </label>
              <input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 sm:py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 text-sm sm:text-base"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="edit-phone"
                className="block text-sm text-foreground/80"
              >
                Mobile Number
              </label>
              <input
                id="edit-phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-2.5 sm:py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 text-sm sm:text-base"
                placeholder="+63 9xx xxx xxxx"
                required
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
                Save Changes
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

