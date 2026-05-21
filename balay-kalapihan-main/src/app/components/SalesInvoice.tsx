import { OrderQRCode } from './OrderQRCode';

interface CartItem {
  id: string;
  item: {
    id: number;
    name: string;
    price: number;
  };
  quantity: number;
  customization: {
    addOnIds: number[];
    specialInstructions: string;
  };
}

interface SalesInvoiceProps {
  orderNumber: string;
  totalAmount: number;
  subtotalAmount: number;
  paymentMethod: string;
  referenceNumber: string;
  pickupDate: string;
  pickupTime: string;
  items: CartItem[];
  customerName: string;
  createdAt: Date | string;
  onClose: () => void;
}

export function SalesInvoice({
  orderNumber,
  totalAmount,
  subtotalAmount,
  paymentMethod,
  referenceNumber,
  pickupDate,
  pickupTime,
  items,
  customerName,
  createdAt,
  onClose,
}: SalesInvoiceProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a simple download of the invoice as HTML
    const invoiceContent = document.getElementById('invoice-content');
    if (invoiceContent) {
      const blob = new Blob([invoiceContent.innerHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${orderNumber}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
      <div className="bg-card rounded-2xl shadow-2xl max-w-3xl w-full p-6 sm:p-8 border border-border animate-scale-in my-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 no-print">
          <h3 className="text-2xl sm:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
            Sales Invoice
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Invoice Content */}
        <div id="invoice-content" className="space-y-6">
          {/* Business Header */}
          <div className="text-center border-b border-border pb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 rounded-full p-4">
                <svg className="w-12 h-12 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-script)' }}>Balay Kalapihan</h1>
            <p className="text-sm text-muted-foreground">259 Larena Drive, Dumaguete City, Philippines</p>
            <p className="text-sm text-muted-foreground">Phone: 0961-842-5718</p>
            <p className="text-sm text-muted-foreground">Email: info@balaykalapihan.com</p>
          </div>

          {/* Invoice Details */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">INVOICE TO:</h4>
              <p className="font-medium">{customerName}</p>
              <p className="text-sm text-muted-foreground">Order #{orderNumber}</p>
            </div>
            <div className="text-left sm:text-right">
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">INVOICE DETAILS:</h4>
              <p className="text-sm">
                <span className="text-muted-foreground">Invoice #:</span> {orderNumber}
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Date:</span>{' '}
                {(typeof createdAt === 'string' ? new Date(createdAt) : createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Time:</span>{' '}
                {(typeof createdAt === 'string' ? new Date(createdAt) : createdAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* Order Items Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Item</th>
                  <th className="text-center p-3 font-medium w-20">Qty</th>
                  <th className="text-right p-3 font-medium w-24">Price</th>
                  <th className="text-right p-3 font-medium w-24">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((cartItem) => (
                  <tr key={cartItem.id}>
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{cartItem.item.name}</p>
                        {cartItem.customization.specialInstructions && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Note: {cartItem.customization.specialInstructions}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">{cartItem.quantity}</td>
                    <td className="p-3 text-right">₱{cartItem.item.price}</td>
                    <td className="p-3 text-right font-medium">
                      ₱{cartItem.item.price * cartItem.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t border-border pt-4">
            <div className="flex justify-end">
              <div className="w-full sm:w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>₱{subtotalAmount}</span>
                </div>

                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-lg font-medium">
                    Total:
                  </span>
                  <span className="text-lg font-medium text-primary">
                    ₱{totalAmount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="text-sm font-medium mb-3">PAYMENT INFORMATION</h4>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Payment Method:</span>{' '}
                <span className="font-medium capitalize">{paymentMethod}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Reference #:</span>{' '}
                <span className="font-medium">{referenceNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Pickup Date:</span>{' '}
                <span className="font-medium">{pickupDate}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Pickup Time:</span>{' '}
                <span className="font-medium">{pickupTime}</span>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center py-4 border-y border-border">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">Scan QR Code for Order Verification</p>
              <OrderQRCode
                orderNumber={orderNumber}
                totalAmount={totalAmount}
                referenceNumber={referenceNumber}
                size={180}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Thank you for your order!</p>
            <p className="mt-2">
              For inquiries, please contact us at 0917-123-4567 or info@balaykalapihan.com
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-all duration-300 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Invoice
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-all duration-300 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-all duration-300 shadow-lg"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Close
          </button>
        </div>

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

          @media print {
            .no-print {
              display: none !important;
            }
            body {
              background: white;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
