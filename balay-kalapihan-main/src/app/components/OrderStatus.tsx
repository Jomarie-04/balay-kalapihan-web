import { useState, useEffect } from "react";
import { OrderQRCode } from "./OrderQRCode";
import { ItemCustomization } from "./CustomizeItemModal";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  image: string;
}

interface CartItem {
  id: string;
  item: MenuItem;
  quantity: number;
  customization: ItemCustomization;
}

interface Order {
  orderNumber: string;
  customer: string;
  totalAmount: number;
  subtotalAmount: number;
  discount: number;
  paymentMethod: string;
  referenceNumber: string;
  pickupDate: string;
  pickupTime: string;
  items: CartItem[];
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "completed"
    | "cancelled";
  createdAt: Date;
  cancelDeadline?: Date;
}

interface OrderStatusProps {
  orders: Order[];
  onBackToMenu: () => void;
  onReorder: (order: Order) => void;
  onCancelOrder: (orderNumber: string) => void;
  onViewInvoice: (order: Order) => void;
}

export function OrderStatus({
  orders,
  onBackToMenu,
  onReorder,
  onCancelOrder,
  onViewInvoice,
}: OrderStatusProps) {
  const [expandedOrder, setExpandedOrder] = useState<
    string | null
  >(null);
  const [, forceUpdate] = useState(0);

  // Force re-render every second to update cancel countdown
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "confirmed":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "preparing":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "ready":
        return "text-green-600 bg-green-50 border-green-200";
      case "completed":
        return "text-gray-600 bg-gray-50 border-gray-200";
      case "cancelled":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusLabel = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "Payment Pending";
      case "confirmed":
        return "Order Confirmed";
      case "preparing":
        return "Preparing Your Order";
      case "ready":
        return "Ready for Pick-up";
      case "cancelled":
        return "Cancelled";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  };

  const getProgressPercentage = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return 25;
      case "confirmed":
        return 50;
      case "preparing":
        return 75;
      case "ready":
        return 100;
      case "completed":
        return 100;
      default:
        return 0;
    }
  };

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="w-full px-3 sm:px-4 md:px-6">
        <div className="mb-6 sm:mb-8 flex flex-col gap-4">
          <div>
            <h2
              className="text-2xl sm:text-3xl md:text-4xl mb-2 text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              My Orders
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
              Track your pre-orders in real-time
            </p>
          </div>
          <button
            onClick={onBackToMenu}
            className="px-4 sm:px-6 py-2 border border-border rounded-lg hover:bg-muted transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto text-xs sm:text-sm md:text-base"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Menu
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-8 sm:py-12 md:py-16 bg-card border border-border rounded-xl px-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-3 sm:mb-4 md:mb-6 rounded-full bg-muted/50 flex items-center justify-center">
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3
            className="text-base sm:text-lg md:text-xl mb-1 sm:mb-2 text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            No orders yet
          </h3>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-4 sm:mb-6">
            Start ordering your favorite dishes!
          </p>
          <button
            onClick={onBackToMenu}
            className="bg-primary text-primary-foreground px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 rounded-lg hover:bg-primary/90 transition-all duration-300 hover:scale-105 active:scale-95 text-xs sm:text-sm md:text-base"
          >
            Browse Menu
          </button>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          {[...orders].reverse().map((order, index) => (
            <div
              key={order.orderNumber}
              className="bg-card border border-border rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-md hover:shadow-lg transition-all duration-300 animate-slide-in overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex flex-col gap-2 sm:gap-3 md:gap-0 mb-3 sm:mb-4 md:mb-6">
                <div>
                  <h3
                    className="text-lg sm:text-xl md:text-2xl mb-0.5 sm:mb-1 text-foreground"
                    style={{
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    Order #{order.orderNumber}
                  </h3>
                  <p className="text-xs sm:text-xs md:text-sm text-muted-foreground">
                    {order.createdAt.toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <div
                    className={`px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full border text-[10px] sm:text-xs md:text-sm font-medium ${getStatusColor(order.status)} w-fit whitespace-nowrap`}
                  >
                    {getStatusLabel(order.status)}
                  </div>
                  {order.status !== 'cancelled' && (
                    <button
                      onClick={() => onViewInvoice(order)}
                      className="px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full border border-border text-[10px] sm:text-xs md:text-sm hover:bg-muted transition-colors flex items-center gap-1 whitespace-nowrap"
                    >
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="hidden sm:inline">Invoice</span>
                    </button>
                  )}
                  {order.cancelDeadline && order.status === 'pending' && (() => {
                    const now = new Date();
                    const deadline = new Date(order.cancelDeadline);
                    const timeRemaining = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / 1000));
                    const minutes = Math.floor(timeRemaining / 60);
                    const seconds = timeRemaining % 60;
                    return (
                      <button
                        onClick={() => onCancelOrder(order.orderNumber)}
                        className="px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full border border-destructive text-destructive text-[10px] sm:text-xs md:text-sm hover:bg-destructive/10 transition-colors flex items-center gap-1 whitespace-nowrap"
                      >
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="hidden sm:inline">Cancel</span>
                        <span className="inline">({minutes}:{seconds.toString().padStart(2, '0')})</span>
                      </button>
                    );
                  })()}
                  {(order.status === 'completed' || order.status === 'cancelled') && (
                    <button
                      onClick={() => onReorder(order)}
                      className="px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full border border-border text-[10px] sm:text-xs md:text-sm hover:bg-muted transition-colors whitespace-nowrap"
                    >
                      Re-order
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3 sm:mb-4 md:mb-6">
                <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-1000 ease-out"
                    style={{
                      width: `${getProgressPercentage(order.status)}%`,
                    }}
                  ></div>
                </div>
                <div className="grid grid-cols-4 gap-0.5 sm:gap-1 md:gap-2 mt-2 sm:mt-3">
                  <div className="text-center">
                    <div
                      className={`w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full mx-auto mb-0.5 sm:mb-1 ${
                        [
                          "confirmed",
                          "preparing",
                          "ready",
                          "completed",
                        ].includes(order.status)
                          ? "bg-primary"
                          : "bg-muted"
                      }`}
                    ></div>
                    <span className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground">
                      Confirmed
                    </span>
                  </div>
                  <div className="text-center">
                    <div
                      className={`w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full mx-auto mb-0.5 sm:mb-1 ${
                        [
                          "preparing",
                          "ready",
                          "completed",
                        ].includes(order.status)
                          ? "bg-primary"
                          : "bg-muted"
                      }`}
                    ></div>
                    <span className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground">
                      Preparing
                    </span>
                  </div>
                  <div className="text-center">
                    <div
                      className={`w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full mx-auto mb-0.5 sm:mb-1 ${
                        ["ready", "completed"].includes(
                          order.status,
                        )
                          ? "bg-primary"
                          : "bg-muted"
                      }`}
                    ></div>
                    <span className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground">
                      Ready
                    </span>
                  </div>
                  <div className="text-center">
                    <div
                      className={`w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full mx-auto mb-0.5 sm:mb-1 ${
                        order.status === "completed"
                          ? "bg-primary"
                          : "bg-muted"
                      }`}
                    ></div>
                    <span className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground">
                      Completed
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-4 bg-muted/30 rounded-lg">
                <div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground block mb-0.5 sm:mb-1">
                    Total Amount
                  </span>
                  <span className="text-sm sm:text-base md:text-lg font-medium text-foreground">
                    ₱{order.totalAmount}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground block mb-0.5 sm:mb-1">
                    Payment
                  </span>
                  <span className="text-xs sm:text-sm md:text-base capitalize text-foreground">
                    {order.paymentMethod}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground block mb-0.5 sm:mb-1">
                    Pick-up Schedule
                  </span>
                  <span className="text-xs sm:text-sm md:text-base text-foreground">
                    {order.pickupDate} • {order.pickupTime}
                  </span>
                </div>
              </div>

              {order.status === "ready" && (
                <div className="mt-3 sm:mt-4 md:mt-4 space-y-3 sm:space-y-4">
                  <div className="p-2.5 sm:p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2 sm:gap-3 animate-pulse-subtle">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5"
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
                    <div className="text-xs sm:text-sm text-green-800 flex-1 min-w-0">
                      <p className="font-medium">
                        Your order is ready for pick-up!
                      </p>
                      <p className="text-green-700">
                        Present the QR code below at the counter.
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setExpandedOrder(
                          expandedOrder === order.orderNumber
                            ? null
                            : order.orderNumber,
                        )
                      }
                      className="text-green-600 hover:text-green-700 transition-colors flex-shrink-0"
                    >
                      {expandedOrder === order.orderNumber ? (
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5"
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
                      )}
                    </button>
                  </div>
                  {expandedOrder === order.orderNumber && (
                    <div className="p-3 sm:p-4 md:p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg sm:rounded-xl border-2 border-primary/20 animate-slide-down overflow-x-auto">
                      <div className="flex justify-center">
                        <OrderQRCode
                          orderNumber={order.orderNumber}
                          totalAmount={order.totalAmount}
                          referenceNumber={order.referenceNumber}
                          size={150}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(order.status === "confirmed" ||
                order.status === "preparing") && (
                <button
                  onClick={() =>
                    setExpandedOrder(
                      expandedOrder === order.orderNumber
                        ? null
                        : order.orderNumber,
                    )
                  }
                  className="mt-3 sm:mt-4 w-full py-1.5 sm:py-2 px-3 sm:px-4 border border-border rounded-lg hover:bg-muted transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                  {expandedOrder === order.orderNumber
                    ? "Hide QR Code"
                    : "Show QR Code"}
                </button>
              )}
              {expandedOrder === order.orderNumber &&
                (order.status === "confirmed" ||
                  order.status === "preparing") && (
                  <div className="mt-3 sm:mt-4 p-3 sm:p-4 md:p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg sm:rounded-xl border-2 border-primary/20 animate-slide-down overflow-x-auto">
                    <div className="flex justify-center">
                      <OrderQRCode
                        orderNumber={order.orderNumber}
                        totalAmount={order.totalAmount}
                        referenceNumber={order.referenceNumber}
                        size={150}
                      />
                    </div>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slide-down {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            max-height: 500px;
            transform: translateY(0);
          }
        }
        @keyframes pulse-subtle {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.95;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.5s ease-out both;
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}