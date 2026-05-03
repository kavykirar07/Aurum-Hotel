"use client";

import { useBookingStore, type AddOnSelection } from "@/store/booking-store";

// Static mock for available add-ons. In Part 5, this would be DB-driven.
const AVAILABLE_ADDONS: Omit<AddOnSelection, "quantity" | "total_price">[] = [
  {
    id: "airport-transfer",
    slug: "airport-transfer",
    name: "Chauffeur Airport Transfer",
    unit_price: "150.00",
    pricing_model: "flat",
  },
  {
    id: "champagne",
    slug: "champagne",
    name: "Champagne on Arrival",
    unit_price: "120.00",
    pricing_model: "flat",
  },
  {
    id: "spa-credit",
    slug: "spa-credit",
    name: "Spa Day Pass",
    unit_price: "85.00",
    pricing_model: "per_person",
  },
];

export function Step2Addons() {
  const store = useBookingStore();

  function handleToggle(addon: typeof AVAILABLE_ADDONS[0]) {
    const isSelected = store.selectedAddOns.some((a) => a.id === addon.id);

    if (isSelected) {
      store.removeAddOn(addon.id);
    } else {
      let quantity = 1;
      if (addon.pricing_model === "per_person") {
        quantity = store.adults + store.children;
      } else if (addon.pricing_model === "per_night") {
        quantity = store.pricing?.nights || 1;
      }

      const total_price = (parseFloat(addon.unit_price) * quantity).toFixed(2);

      store.toggleAddOn({
        ...addon,
        quantity,
        total_price,
      });
    }
  }

  return (
    <div className="card p-8">
      <h2 className="text-display-md text-charcoal mb-2">Enhance Your Stay</h2>
      <p className="text-muted mb-8">Curate your experience with our signature enhancements.</p>

      <div className="space-y-4 mb-8">
        {AVAILABLE_ADDONS.map((addon) => {
          const isSelected = store.selectedAddOns.some((a) => a.id === addon.id);
          const priceDisplay = addon.pricing_model === "per_person" 
            ? `$${addon.unit_price} / person`
            : `$${addon.unit_price}`;

          return (
            <div
              key={addon.id}
              onClick={() => handleToggle(addon)}
              className={`
                flex items-center justify-between p-5 rounded-lg border-2 cursor-pointer transition-all
                ${isSelected ? "border-gold bg-gold-pale/30" : "border-black/5 hover:border-gold/50 bg-white"}
              `}
            >
              <div className="flex items-center gap-4">
                {/* Custom Checkbox */}
                <div className={`
                  w-5 h-5 rounded flex items-center justify-center transition-colors
                  ${isSelected ? "bg-gold text-white" : "border-2 border-black/20"}
                `}>
                  {isSelected && (
                    <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.5 7.5L5.5 10.5L11.5 3.5" />
                    </svg>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-charcoal">{addon.name}</h4>
                  <p className="text-sm text-muted">{priceDisplay}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-6 border-t border-black/5 flex justify-between items-center">
        <button type="button" onClick={() => store.prevStep()} className="btn btn-ghost">
          Back
        </button>
        <button type="button" onClick={() => store.nextStep()} className="btn btn-gold">
          Continue to Payment
        </button>
      </div>
    </div>
  );
}
