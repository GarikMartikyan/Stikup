"use client";

import { RefreshCw, Send, Unlock } from "lucide-react";
import { ActionButton } from "./action-button";
import { FREE_COUNT, PACK_SIZE, PRICE_LABEL } from "./data";

type ActionsRowProps = {
  claiming: boolean;
  onClaim: () => void;
};

export function ActionsRow({ claiming, onClaim }: ActionsRowProps) {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      <ActionButton
        tone="brand"
        title={`Unlock all ${PACK_SIZE}`}
        subtitle={PRICE_LABEL}
        icon={Unlock}
        hint="Recommended"
        primary
      />
      <ActionButton
        tone="ghost"
        title={`Take ${FREE_COUNT} free`}
        subtitle={claiming ? "Sending to Telegram…" : "Install to Telegram"}
        icon={claiming ? RefreshCw : Send}
        onClick={onClaim}
        disabled={claiming}
      />
      <ActionButton
        tone="ghost"
        title="Regenerate"
        subtitle="1 free regen left"
        icon={RefreshCw}
      />
    </div>
  );
}
