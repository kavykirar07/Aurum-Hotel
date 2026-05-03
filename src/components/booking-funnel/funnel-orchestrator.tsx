"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore, useSoftLockTtl } from "@/store/booking-store";
import { OrderSummary } from "./order-summary";
import { Step1Guest } from "./step-1-guest";
import { Step2Addons } from "./step-2-addons";
import { Step3Payment } from "./step-3-payment";
import { Step4Confirmation } from "./step-4-confirmation";

export function FunnelOrchestrator() {
  const router = useRouter();
  const store = useBookingStore();
  const [mounted, setMounted] = useState(false);
  const lockTtl = useSoftLockTtl();

  // Prevent hydration mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Redirect if no room is selected or soft lock expired (unless we are at step 4)
  useEffect(() => {
    if (mounted && store.currentStep !== 4) {
      if (!store.selectedRoom || !store.checkIn || !store.checkOut) {
        router.replace("/rooms");
      } else if (lockTtl <= 0) {
        alert("Your session has expired. Please select your room again.");
        store.reset();
        router.replace("/rooms");
      }
    }
  }, [mounted, store, lockTtl, router]);

  if (!mounted) return <div className="p-20 text-center">Loading...</div>;

  // Don't render funnel if missing core data and not on confirmation
  if (store.currentStep !== 4 && (!store.selectedRoom || lockTtl <= 0)) {
    return null;
  }

  return (
    <div className="container py-8">
      {/* Progress Bar */}
      {store.currentStep !== 4 && (
        <div className="mb-8">
          <div className="flex justify-between text-xs font-medium text-muted uppercase tracking-widest mb-3">
            <span className={store.currentStep >= 1 ? "text-gold-dark" : ""}>Guest Details</span>
            <span className={store.currentStep >= 2 ? "text-gold-dark" : ""}>Enhancements</span>
            <span className={store.currentStep >= 3 ? "text-gold-dark" : ""}>Payment</span>
          </div>
          <div className="h-1 w-full bg-black/5 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-gold transition-all duration-500 ease-out"
              style={{ width: `${(store.currentStep / 3) * 100}%` }}
            />
          </div>
          
          {/* Lock countdown */}
          <div className="text-center mt-3 text-sm text-error">
            Room held for: {Math.floor(lockTtl / 60)}:{(lockTtl % 60).toString().padStart(2, "0")}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Main Content */}
        <div className="flex-1">
          {store.currentStep === 1 && <Step1Guest />}
          {store.currentStep === 2 && <Step2Addons />}
          {store.currentStep === 3 && <Step3Payment />}
          {store.currentStep === 4 && <Step4Confirmation />}
        </div>

        {/* Sidebar */}
        {store.currentStep !== 4 && (
          <aside className="w-full lg:w-[380px]">
            <OrderSummary />
          </aside>
        )}
      </div>
    </div>
  );
}
