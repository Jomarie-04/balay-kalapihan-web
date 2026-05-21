interface AboutUsProps {
  onBack: () => void;
}

export function AboutUs({ onBack }: AboutUsProps) {
  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6 sm:mb-8 group"
        >
          <svg
            className="w-5 h-5 transition-transform group-hover:-translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm sm:text-base">Back to Menu</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-block mb-4 sm:mb-6">
            <img
              src="/images/kipin-logo.png"
              alt="Kipin Logo"
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl mb-4 text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
            About Balay Kalapihan
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Bringing the authentic taste of Filipino home cooking to your table
          </p>
        </div>

        {/* Location & Map Section */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            Visit Our Location
          </h2>
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {/* Map */}
            <div className="rounded-2xl overflow-hidden shadow-lg border border-border h-80 md:h-96">
              <iframe
                title="Balay Kalapihan Location"
                width="100%"
                height="100%"
                frameBorder="0"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3911.024766453065!2d123.3112!3d9.3045!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33afa32fde0e8175%3A0x123456789!2s259%20Larena%20Drive%2C%20Dumaguete%20City%2C%206200!5e0!3m2!1sen!2sph!4v1234567890"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* Location Description */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-lg">
                <h3 className="text-xl sm:text-2xl mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                  Our Pickup Location
                </h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Address</p>
                    <p className="text-base sm:text-lg font-medium">
                      259 Larena Drive
                      <br />
                      Dumaguete City, 6200
                      <br />
                      Philippines
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Phone</p>
                    <p className="text-base sm:text-lg font-medium"> 0961-842-5718</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Email</p>
                    <p className="text-base sm:text-lg font-medium">info@balaykalapihan.com</p>
                  </div>
                  <a
                    href="https://maps.app.goo.gl/W3oi7Am4cr74SZAdA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Get Directions
                  </a>
                </div>
              </div>

              {/* Parking & Accessibility Info */}
              <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-lg">
                <h3 className="text-lg sm:text-xl mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Parking & Accessibility
                </h3>
                <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="text-primary font-bold">•</span>
                    Free parking available for customers
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary font-bold">•</span>
                    Wheelchair accessible entrance
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary font-bold">•</span>
                    Easy loading/unloading area for pickups
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 sm:space-y-8">
          {/* Our Story */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-lg">
            <h2 className="text-2xl sm:text-3xl mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Our Story
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
              Balay Kalapihan, which means "House of Deliciousness," was founded in 2024 with a simple mission: to bring the soul of Filipino hospitality to every cup. While our name promises excellence, our passion lies in the art of the perfect beverage. We believe that a great drink is a bridge to heritage—a liquid reminder of home and community.
            </p>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
              Every coffee and specialty drink we craft is a tribute to the rich flavors of our islands, blending time-honored traditions with modern techniques. From the earthy notes of our local beans to our refreshing signature blends, each drink is prepared with love and care.
              </p>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">For us, a beverage is more than just a refreshment—it's a connection to our roots, our families, and our most cherished memories. At Balay Kalapihan, we invite you to find home in every sip.</p>
          </div>

          {/* Our Mission */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-lg">
            <h2 className="text-2xl sm:text-3xl mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Our Mission
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
              At Balay Kalapihan, our mission is to provide a seamless and reliable pre-order system that allows our community to enjoy premium Filipino coffee and handcrafted beverages without the wait. We are committed to:
            </p>
            <ul className="space-y-3 text-sm sm:text-base text-muted-foreground">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Sourcing only the finest, high-quality beans and fresh ingredients for every drink we serve.</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Preserving the rich heritage of Filipino beverage culture through traditional inspirations and modern preparation methods.</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Delivering exceptional customer care with a focus on precision and timely order fulfillment.</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Making the unique and comforting flavors of Filipino drinks accessible to everyone, one handcrafted pour at a time.</span>
              </li>
            </ul>
          </div>

          {/* Contact & Hours */}
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-lg">
              <h2 className="text-xl sm:text-2xl mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                Contact Us
              </h2>
              <div className="space-y-3 text-sm sm:text-base">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-muted-foreground"> 0961-842-5718</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-muted-foreground">info@balaykalapihan.com</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-muted-foreground">259 Larena Drive, Dumaguete City, 6200, Philippines</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-lg">
              <h2 className="text-xl sm:text-2xl mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                Business Hours
              </h2>
              <div className="space-y-3 text-sm sm:text-base">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Monday - Friday</span>
                  <span className="font-medium">10:00 AM - 9:00 PM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Saturday</span>
                  <span className="font-medium">Closed</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Sunday</span>
                  <span className="font-medium">Closed</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Pre-orders accepted during business hours. Pickup times may vary based on order volume.
                </p>
              </div>
            </div>
          </div>

          {/* Values */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl sm:text-3xl mb-6 text-center" style={{ fontFamily: 'var(--font-display)' }}>
              Our Values
            </h2>
            <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl sm:text-3xl">❤️</span>
                </div>
                <h3 className="text-base sm:text-lg font-medium mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  Passion
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Every drink is crafted with love and dedication
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl sm:text-3xl">🏠</span>
                </div>
                <h3 className="text-base sm:text-lg font-medium mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  Authenticity
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Traditional inspirations, authentic flavors
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl sm:text-3xl">⭐</span>
                </div>
                <h3 className="text-base sm:text-lg font-medium mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  Excellence
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Committed to quality in every aspect
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
