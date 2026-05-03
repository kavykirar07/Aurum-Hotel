"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc-client";

export function CancelBookingButton({ bookingId, checkIn }: { bookingId: string; checkIn: string }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const router = useRouter();

  const cancelMutation = trpc.bookings.cancel.useMutation({
    onSuccess: (data) => {
      alert(
        `Booking cancelled successfully.\nRefund processed: ${data.refund_fraction * 100}% ($${data.refund_amount})`
      );
      router.refresh();
      setIsConfirming(false);
    },
    onError: (error) => {
      alert(`Cancellation failed: ${error.message}`);
      setIsConfirming(false);
    },
  });

  // eslint-disable-next-line react-hooks/purity
  const daysUntilCheckIn = (new Date(checkIn).getTime() - Date.now()) / 86_400_000;
  
  let refundText = "No refund available";
  if (daysUntilCheckIn > 7) {
    refundText = "Full refund available";
  } else if (daysUntilCheckIn >= 1) {
    refundText = "50% refund available";
  }

  function handleCancel() {
    if (isConfirming) {
      cancelMutation.mutate({ booking_id: bookingId });
    } else {
      setIsConfirming(true);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleCancel}
        disabled={cancelMutation.isPending}
        className={`btn btn-sm ${isConfirming ? "btn-outline border-error text-error hover:bg-error hover:text-white" : "btn-outline"}`}
      >
        {cancelMutation.isPending ? "Cancelling..." : isConfirming ? "Confirm Cancellation" : "Cancel Booking"}
      </button>
      
      {isConfirming && (
        <>
          <p className="text-xs text-muted max-w-[200px] text-right">
            Are you sure? This action cannot be undone. {refundText}.
          </p>
          <button 
            onClick={() => setIsConfirming(false)} 
            disabled={cancelMutation.isPending}
            className="text-xs text-charcoal underline underline-offset-2"
          >
            Keep Reservation
          </button>
        </>
      )}
    </div>
  );
}
