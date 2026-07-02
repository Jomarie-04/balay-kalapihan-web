import { useState } from "react";
import { api } from "../../services/api";

interface CustomerLoginProps {
  onLogin: (username: string, userData: CustomerUserData) => void;
  onBackToPortalSelect: () => void;
}

export interface CustomerUserData {
  id?: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
}

export function CustomerLogin({ onLogin, onBackToPortalSelect }: CustomerLoginProps) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetStep, setResetStep] = useState<"email" | "code">("email");
  const [showResetMessage, setShowResetMessage] = useState(false);
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!username || !password) {
      setLoginError("Please fill in all fields");
      return;
    }

    // Prevent admin login attempt
    if (username === "admin") {
      setLoginError("Invalid credentials. Use the admin portal to login as admin.");
      return;
    }

    // Regular user login
    api.login(username, password)
      .then((response: any) => {
        if (response.token) {
          api.setToken(response.token);

          // Store token and user data in localStorage for session persistence
          localStorage.setItem("userToken", response.token);
          localStorage.setItem("userData", JSON.stringify({
            id: response.user.id,
            username: response.user.username,
            email: response.user.email,
            fullName: response.user.fullName,
            phoneNumber: response.user.phoneNumber,
          }));

          onLogin(username, {
            id: response.user.id,
            username: response.user.username,
            email: response.user.email,
            fullName: response.user.fullName,
            phoneNumber: response.user.phoneNumber,
          });
        }
      })
      .catch((error: any) => {
        console.log("Backend login failed, trying localStorage:", error);

        // Fallback to localStorage
        const users = JSON.parse(
          localStorage.getItem("balayKalapihanUsers") || "{}",
        );
        const userData = users[username];

        if (userData && userData.password === password) {
          const fallbackToken = `user-fallback-${username}::${userData.fullName || username}`;
          api.setToken(fallbackToken);
          localStorage.setItem("userToken", fallbackToken);
          localStorage.setItem("userData", JSON.stringify({
            id: userData.id,
            username: userData.username,
            email: userData.email,
            fullName: userData.fullName,
            phoneNumber: userData.phoneNumber,
          }));

          onLogin(username, {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            fullName: userData.fullName,
            phoneNumber: userData.phoneNumber,
          });
        } else {
          setLoginError("Invalid username or password");
        }
      });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      username &&
      password &&
      email &&
      fullName &&
      phoneNumber &&
      password === confirmPassword
    ) {
      // Prevent admin account creation
      if (username === "admin") {
        setLoginError("This username is reserved");
        return;
      }

      // Try to sign up via backend API first
      api.signup(username, email, fullName, password, phoneNumber)
        .then(() => {
          // Account created successfully - show success message
          setShowSignupSuccess(true);
          setTimeout(() => {
            setShowSignupSuccess(false);
            setMode("login");
            setUsername("");
            setPassword("");
            setEmail("");
            setFullName("");
            setPhoneNumber("");
            setConfirmPassword("");
          }, 2000);
        })
        .catch((error: any) => {
          console.log("Backend signup failed, using localStorage:", error);

          // Fallback to localStorage
          const users = JSON.parse(
            localStorage.getItem("balayKalapihanUsers") || "{}",
          );

          if (users[username]) {
            setLoginError("Username already exists");
            return;
          }

          users[username] = {
            id: Math.floor(Math.random() * 100000),
            username,
            password,
            email,
            fullName,
            phoneNumber,
          };

          localStorage.setItem(
            "balayKalapihanUsers",
            JSON.stringify(users),
          );

          // Show success message - don't auto login
          setShowSignupSuccess(true);
          setTimeout(() => {
            setShowSignupSuccess(false);
            setMode("login");
            setUsername("");
            setPassword("");
            setEmail("");
            setFullName("");
            setPhoneNumber("");
            setConfirmPassword("");
          }, 2000);
        });
    } else if (password !== confirmPassword) {
      setLoginError("Passwords do not match");
    } else {
      setLoginError("Please fill in all fields");
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const form = e.currentTarget as HTMLFormElement;
    const emailInput = form.elements.namedItem("reset-email") as HTMLInputElement | null;
    const resetCodeInput = form.elements.namedItem("reset-code") as HTMLInputElement | null;
    const newPasswordInput = form.elements.namedItem("reset-new-password") as HTMLInputElement | null;
    const confirmNewPasswordInput = form.elements.namedItem("reset-confirm-password") as HTMLInputElement | null;

    const currentEmail = emailInput?.value.trim() || email;
    const currentResetCode = resetCodeInput?.value.trim() || resetCode;
    const currentNewPassword = newPasswordInput?.value || newPassword;
    const currentConfirmNewPassword = confirmNewPasswordInput?.value || confirmNewPassword;

    if (resetStep === "email") {
      if (!currentEmail) {
        setLoginError("Please enter your email");
        return;
      }

      setEmail(currentEmail);

      api.forgotPassword(currentEmail)
        .then(() => {
          setResetStep("code");
          setShowResetMessage(true);
          setTimeout(() => setShowResetMessage(false), 3000);
        })
        .catch((error: any) => {
          setLoginError(error?.message || "Unable to send verification code");
        });
      return;
    }

    if (!currentResetCode || !currentNewPassword || !currentConfirmNewPassword) {
      setLoginError("Please fill in all fields");
      return;
    }

    if (currentNewPassword.length < 6) {
      setLoginError("Password must be at least 6 characters long");
      return;
    }

    if (currentNewPassword !== currentConfirmNewPassword) {
      setLoginError("Passwords do not match");
      return;
    }

    setEmail(currentEmail);
    setResetCode(currentResetCode);
    setNewPassword(currentNewPassword);
    setConfirmNewPassword(currentConfirmNewPassword);

    api.verifyResetCode(currentEmail, currentResetCode, currentNewPassword)
      .then(() => {
        setShowResetMessage(true);
        setTimeout(() => {
          setShowResetMessage(false);
          setMode("login");
          setResetStep("email");
          setEmail("");
          setResetCode("");
          setNewPassword("");
          setConfirmNewPassword("");
        }, 3000);
      })
      .catch((error: any) => {
        setLoginError(error?.message || "Invalid or expired verification code");
      });
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
            <div className="absolute inset-0 blur-xl opacity-30 bg-white rounded-full"></div>
            <div className="relative rounded-full p-2 sm:p-3 shadow-lg">
              <img
                src="/images/kipin-logo.png"
                alt="Kipin Logo"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
              />
            </div>
          </div>
          <h1
            className="text-3xl sm:text-4xl md:text-5xl mb-3 text-white"
            style={{ fontFamily: "var(--font-script)" }}
          >
            Balay Kalapihan
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground tracking-wide">
            Pre-order your favorites with ease
          </p>
          <p className="text-xs text-muted-foreground/70 mt-2">Customer Portal</p>
        </div>

        {/* Login/Signup Card */}
        <div className="bg-card rounded-2xl shadow-2xl p-6 sm:p-8 border border-border backdrop-blur-sm animate-slide-up">
          <h2
            className="text-2xl sm:text-3xl mb-2 text-center"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {mode === "login"
              ? "Welcome!"
              : mode === "signup"
                ? "Create Account"
                : "Reset Password"}
          </h2>
          <p className="text-center text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base">
            {mode === "login"
              ? "Sign in to your account"
              : mode === "signup"
                ? "Join Balay Kalapihan today"
                : "Enter your email to reset password"}
          </p>

          {/* Error Message Display */}
          {loginError && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg animate-slide-down">
              <p className="text-sm text-center text-destructive">
                {loginError}
              </p>
            </div>
          )}

          {/* Success Message for Password Reset */}
          {showResetMessage && (
            <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg animate-slide-down">
              <p className="text-sm text-center text-primary">
                {resetStep === "email"
                  ? "Verification code sent to your email!"
                  : "Password updated successfully!"}
              </p>
            </div>
          )}

          {/* Success Message for Signup */}
          {showSignupSuccess && (
            <div className="mb-6 p-4 bg-green-600/20 border border-green-600/30 rounded-lg animate-slide-down">
              <p className="text-sm text-center text-green-600">
                Account created successfully! Please login.
              </p>
            </div>
          )}

          {/* Login Form */}
          {mode === "login" && (
            <form
              onSubmit={handleLogin}
              className="space-y-5 sm:space-y-6"
            >
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="block text-sm text-foreground/80"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 sm:py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 hover:border-primary/30 text-sm sm:text-base"
                  placeholder="Enter your username"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm text-foreground/80"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 pr-12 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 hover:border-primary/30 text-sm sm:text-base"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-2.5 sm:py-3 rounded-lg hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Sign In
              </button>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setLoginError(null);
                  }}
                  className="text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                  Sign Up
                </button>
              </p>
            </form>
          )}

          {/* Signup Form */}
          {mode === "signup" && (
            <form
              onSubmit={handleSignup}
              className="space-y-4 sm:space-y-5"
            >
              <div className="space-y-2">
                <label className="block text-sm text-foreground/80">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 sm:py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 hover:border-primary/30 text-sm sm:text-base"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-foreground/80">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 sm:py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 hover:border-primary/30 text-sm sm:text-base"
                  placeholder="Choose a username"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-foreground/80">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 sm:py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 hover:border-primary/30 text-sm sm:text-base"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-foreground/80">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-2.5 sm:py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 hover:border-primary/30 text-sm sm:text-base"
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-foreground/80">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 pr-12 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 hover:border-primary/30 text-sm sm:text-base"
                    placeholder="Create a password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-foreground/80">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 pr-12 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 hover:border-primary/30 text-sm sm:text-base"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-2.5 sm:py-3 rounded-lg hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Create Account
              </button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setLoginError(null);
                  }}
                  className="text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                  Sign In
                </button>
              </p>
            </form>
          )}

          {/* Forgot Password Form */}
          {mode === "forgot" && (
            <form
              onSubmit={handleForgotPassword}
              className="space-y-5 sm:space-y-6"
            >
              <div className="space-y-2">
                <label className="block text-sm text-foreground/80">
                  {resetStep === "email" ? "Email Address" : "Verification Code"}
                </label>
                {resetStep === "email" ? (
                  <input
                    name="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 hover:border-primary/30 text-sm sm:text-base"
                    placeholder="Enter your email"
                    required
                  />
                ) : (
                  <input
                    name="reset-code"
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 hover:border-primary/30 text-sm sm:text-base"
                    placeholder="Enter 6-digit code"
                    required
                  />
                )}
              </div>

              {resetStep === "code" && (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm text-foreground/80">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        name="reset-new-password"
                        type={showResetPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2.5 sm:py-3 pr-12 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 hover:border-primary/30 text-sm sm:text-base"
                        placeholder="Choose a new password"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showResetPassword ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm text-foreground/80">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        name="reset-confirm-password"
                        type={showResetConfirmPassword ? "text" : "password"}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full px-4 py-2.5 sm:py-3 pr-12 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 hover:border-primary/30 text-sm sm:text-base"
                        placeholder="Confirm your new password"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showResetConfirmPassword ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-2.5 sm:py-3 rounded-lg hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {resetStep === "email" ? "Send Verification Code" : "Reset Password"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setLoginError(null);
                }}
                className="w-full text-primary hover:text-primary/80 font-semibold transition-colors text-sm sm:text-base"
              >
                Back to Login
              </button>
            </form>
          )}

          {/* Back to Portal Selection Button */}
          <button
            type="button"
            onClick={onBackToPortalSelect}
            className="w-full mt-6 pt-6 border-t border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Portal Selection
          </button>
        </div>
      </div>
    </div>
  );
}
