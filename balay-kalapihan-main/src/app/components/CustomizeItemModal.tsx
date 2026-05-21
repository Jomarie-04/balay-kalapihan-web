import { useMemo, useState } from "react";

export type SugarLevel = "0%" | "25%" | "50%" | "75%" | "100%";
export type IceLevel =
  | "No Ice"
  | "Less Ice"
  | "Regular Ice"
  | "Extra Ice";
export type SizeOption = "12oz" | "16oz" | "22oz";

export interface AddOnOption {
  id: number;
  name: string;
  price: number;
}

export interface ItemCustomization {
  sugarLevel: SugarLevel;
  iceLevel: IceLevel;
  addOnIds: number[];
  notes: string;
  size?: SizeOption;
}

interface CustomizeItemModalProps {
  itemName: string;
  basePrice: number;
  addOns: AddOnOption[];
  onConfirm: (customization: ItemCustomization) => void;
  onCancel: () => void;
}

export function CustomizeItemModal({
  itemName,
  basePrice,
  addOns,
  onConfirm,
  onCancel,
}: CustomizeItemModalProps) {
  const [sugarLevel, setSugarLevel] =
    useState<SugarLevel>("100%");
  const [iceLevel, setIceLevel] =
    useState<IceLevel>("Regular Ice");
  const [size, setSize] =
    useState<SizeOption>("16oz");
  const [addOnIds, setAddOnIds] = useState<number[]>([]);
  const [notes, setNotes] = useState("");

  // Size pricing adjustments
  const sizePriceAdjustment: Record<SizeOption, number> = {
    "12oz": 0,      // Base price
    "16oz": 10,     // Add ₱10 for medium
    "22oz": 30,     // Add ₱30 for large
  };

  const selectedAddOns = useMemo(
    () => addOns.filter((a) => addOnIds.includes(a.id)),
    [addOns, addOnIds],
  );
  const addOnsTotal = selectedAddOns.reduce(
    (sum, a) => sum + a.price,
    0,
  );
  const sizeAdjustment = sizePriceAdjustment[size];
  const total = basePrice + sizeAdjustment + addOnsTotal;

  const toggleAddOn = (id: number) => {
    setAddOnIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id],
    );
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-border animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start gap-4 mb-6">
          <div className="min-w-0">
            <h3
              className="text-xl sm:text-2xl line-clamp-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Customize
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {itemName}
            </p>
          </div>
          <button
            onClick={onCancel}
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

        <div className="space-y-6">
          <div className="p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">
                Base
              </span>
              <span className="font-medium">₱{basePrice}</span>
            </div>
            {sizeAdjustment > 0 && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-muted-foreground">
                  Size ({size})
                </span>
                <span className="font-medium">+₱{sizeAdjustment}</span>
              </div>
            )}
            <div className="flex justify-between items-center mt-2">
              <span className="text-muted-foreground">
                Add-ons
              </span>
              <span className="font-medium">
                {addOnsTotal > 0 && "+"}₱{addOnsTotal}
              </span>
            </div>
            <div className="border-t border-border mt-3 pt-3 flex justify-between items-center">
              <span className="text-muted-foreground">
                Item total
              </span>
              <span className="text-2xl text-primary font-bold">
                ₱{total}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Size</p>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  "12oz",
                  "16oz",
                  "22oz",
                ] as SizeOption[]
              ).map((sz) => (
                <button
                  type="button"
                  key={sz}
                  onClick={() => setSize(sz)}
                  className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                    size === sz
                      ? "bg-primary/10 border-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <div>{sz}</div>
                  <div className="text-xs text-muted-foreground">
                    ₱{basePrice + sizePriceAdjustment[sz]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Sugar level</p>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  "0%",
                  "25%",
                  "50%",
                  "75%",
                  "100%",
                ] as SugarLevel[]
              ).map((lvl) => (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => setSugarLevel(lvl)}
                  className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                    sugarLevel === lvl
                      ? "bg-primary/10 border-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Ice level</p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  "No Ice",
                  "Less Ice",
                  "Regular Ice",
                  "Extra Ice",
                ] as IceLevel[]
              ).map((lvl) => (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => setIceLevel(lvl)}
                  className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                    iceLevel === lvl
                      ? "bg-primary/10 border-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {addOns.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Add-ons</p>
              <div className="space-y-2">
                {addOns.map((a) => {
                  const checked = addOnIds.includes(a.id);
                  return (
                    <button
                      type="button"
                      key={a.id}
                      onClick={() => toggleAddOn(a.id)}
                      className={`w-full px-4 py-3 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
                        checked
                          ? "bg-primary/10 border-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <span className="text-sm sm:text-base truncate">
                        {a.name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        +₱{a.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm text-foreground/80">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-20 px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 text-sm sm:text-base"
              placeholder="e.g. less sweet, no straw, etc."
              maxLength={120}
            />
            <p className="text-xs text-muted-foreground">
              {notes.length}/120
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() =>
                onConfirm({
                  sugarLevel,
                  iceLevel,
                  addOnIds,
                  notes: notes.trim(),
                  size,
                })
              }
              className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Add to Cart
            </button>
          </div>
        </div>

        <style>{`
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scale-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in { animation: fade-in 0.2s ease-out; }
          .animate-scale-in { animation: scale-in 0.3s ease-out; }
        `}</style>
      </div>
    </div>
  );
}