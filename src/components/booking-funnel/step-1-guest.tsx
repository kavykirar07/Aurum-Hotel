"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBookingStore } from "@/store/booking-store";

const GuestSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(80),
  last_name: z.string().min(1, "Last name is required").max(80),
  email: z.string().email("Valid email is required"),
  phone: z.string().max(20).optional(),
  special_requests: z.string().max(2000).optional(),
});

type GuestFormValues = z.infer<typeof GuestSchema>;

export function Step1Guest() {
  const store = useBookingStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GuestFormValues>({
    resolver: zodResolver(GuestSchema),
    defaultValues: {
      first_name: store.guestDetails.first_name || "",
      last_name: store.guestDetails.last_name || "",
      email: store.guestDetails.email || "",
      phone: store.guestDetails.phone || "",
      special_requests: store.guestDetails.special_requests || "",
    },
  });

  function onSubmit(data: GuestFormValues) {
    store.setGuestDetails(data);
    store.nextStep();
  }

  return (
    <div className="card p-8">
      <h2 className="text-display-md text-charcoal mb-2">Guest Details</h2>
      <p className="text-muted mb-8">Please provide your details to secure your reservation.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div>
            <label className="text-label text-muted block mb-1">First Name *</label>
            <input
              type="text"
              {...register("first_name")}
              className={`input ${errors.first_name ? "input-error" : ""}`}
              placeholder="e.g. Jane"
            />
            {errors.first_name && <p className="text-xs text-error mt-1">{errors.first_name.message}</p>}
          </div>

          {/* Last Name */}
          <div>
            <label className="text-label text-muted block mb-1">Last Name *</label>
            <input
              type="text"
              {...register("last_name")}
              className={`input ${errors.last_name ? "input-error" : ""}`}
              placeholder="e.g. Doe"
            />
            {errors.last_name && <p className="text-xs text-error mt-1">{errors.last_name.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email */}
          <div>
            <label className="text-label text-muted block mb-1">Email Address *</label>
            <input
              type="email"
              {...register("email")}
              className={`input ${errors.email ? "input-error" : ""}`}
              placeholder="jane.doe@example.com"
            />
            {errors.email && <p className="text-xs text-error mt-1">{errors.email.message}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="text-label text-muted block mb-1">Phone Number (Optional)</label>
            <input
              type="tel"
              {...register("phone")}
              className={`input ${errors.phone ? "input-error" : ""}`}
              placeholder="+1 234 567 890"
            />
            {errors.phone && <p className="text-xs text-error mt-1">{errors.phone.message}</p>}
          </div>
        </div>

        {/* Special Requests */}
        <div>
          <label className="text-label text-muted block mb-1">Special Requests (Optional)</label>
          <textarea
            {...register("special_requests")}
            className={`input min-h-[100px] resize-y ${errors.special_requests ? "input-error" : ""}`}
            placeholder="Please note any dietary requirements, arrival times, or special occasions..."
          />
          {errors.special_requests && <p className="text-xs text-error mt-1">{errors.special_requests.message}</p>}
        </div>

        <div className="pt-6 border-t border-black/5 flex justify-end">
          <button type="submit" className="btn btn-gold">
            Continue to Enhancements
          </button>
        </div>
      </form>
    </div>
  );
}
