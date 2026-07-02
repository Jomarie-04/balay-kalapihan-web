interface PortalSelectorProps {
  onSelectPortal: (portal: 'customer' | 'admin') => void;
}

export function PortalSelector({ onSelectPortal }: PortalSelectorProps) {
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

      <div className="w-full max-w-2xl relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12 sm:mb-16 animate-fade-in">
          <div className="inline-block mb-4 relative">
            <div className="absolute inset-0 blur-xl opacity-30 bg-white rounded-full"></div>
            <div className="relative rounded-full p-2 sm:p-3 shadow-lg">
              <img
                src="/images/kipin-logo.png"
                alt="Kipin Logo"
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
              />
            </div>
          </div>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl mb-4 text-white"
            style={{ fontFamily: "var(--font-script)" }}
          >
            Balay Kalapihan
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground tracking-wide">
            Select Portal to Continue
          </p>
        </div>

        {/* Portal Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          {/* Customer Portal Card */}
          <button
            onClick={() => onSelectPortal('customer')}
            className="group relative bg-card rounded-2xl shadow-2xl p-8 sm:p-10 border border-border backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] animate-slide-up text-left"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>

            <div className="relative z-10">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <svg
                  className="w-8 h-8 sm:w-10 sm:h-10 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>

              <h2
                className="text-2xl sm:text-3xl mb-3 text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Customer
              </h2>

              <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                Browse our menu, place orders, and track your food status.
              </p>

              <div className="space-y-2 mb-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Order your favorites
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Track order status
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Secure checkout
                </div>
              </div>

              <div className="inline-flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all text-sm sm:text-base">
                Login as Customer
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </button>

          {/* Admin Portal Card */}
          <button
            onClick={() => onSelectPortal('admin')}
            className="group relative bg-card rounded-2xl shadow-2xl p-8 sm:p-10 border border-orange-500/30 backdrop-blur-sm hover:border-orange-500/50 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] animate-slide-up text-left"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>

            <div className="relative z-10">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-orange-600/10 flex items-center justify-center mb-6 group-hover:bg-orange-600/20 transition-colors">
                <svg
                  className="w-8 h-8 sm:w-10 sm:h-10 text-orange-600"
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

              <h2
                className="text-2xl sm:text-3xl mb-3 text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Admin
              </h2>

              <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                Manage menu items, view orders, and control shop settings.
              </p>

              <div className="space-y-2 mb-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Manage inventory
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  View all orders
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Restricted access
                </div>
              </div>

              <div className="inline-flex items-center gap-2 text-orange-600 font-semibold group-hover:gap-3 transition-all text-sm sm:text-base">
                Login as Admin
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-12 sm:mt-16 text-white text-sm">
          <p>
            Need help? Contact us at{" "}
            <span className="text-primary font-semibold">support@balaykalapihan.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}
