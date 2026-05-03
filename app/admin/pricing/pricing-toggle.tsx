"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc-client";

export function PricingToggle({ id, isActive, modifier }: { id: string; isActive: boolean; modifier: number }) {
  const [active, setActive] = useState(isActive);
  const router = useRouter();

  const updateMutation = trpc.admin.updatePricingModifier.useMutation({
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      alert(`Update failed: ${error.message}`);
      setActive(!active); // revert
    },
  });

  function toggle() {
    const nextState = !active;
    setActive(nextState);
    updateMutation.mutate({
      id,
      is_active: nextState,
      price_modifier: modifier,
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={updateMutation.isPending}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
        ${active ? "bg-green-500" : "bg-gray-300"}
        ${updateMutation.isPending ? "opacity-50 cursor-wait" : "cursor-pointer"}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${active ? "translate-x-6" : "translate-x-1"}
        `}
      />
    </button>
  );
}
