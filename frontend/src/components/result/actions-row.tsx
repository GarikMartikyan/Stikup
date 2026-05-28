"use client";

import { RefreshCw, Send, Unlock } from "lucide-react";
import { ActionButton } from "./action-button";
import { FREE_COUNT, PACK_SIZE, PRICE_LABEL } from "./data";
import { useT } from "@/components/language-provider";

type ActionsRowProps = {
  claiming: boolean;
  onClaim: () => void;
};

export function ActionsRow({ claiming, onClaim }: ActionsRowProps) {
  const t = useT();
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      <ActionButton
        tone="brand"
        title={t("result.actions.unlock_all", { count: PACK_SIZE })}
        subtitle={PRICE_LABEL}
        icon={Unlock}
        hint={t("result.actions.recommended")}
        primary
      />
      <ActionButton
        tone="secondary"
        title={t("result.actions.take_free", { count: FREE_COUNT })}
        subtitle={claiming ? t("result.actions.sending_telegram") : t("result.actions.install_telegram")}
        icon={claiming ? RefreshCw : Send}
        onClick={onClaim}
        disabled={claiming}
      />
      <ActionButton
        tone="ghost"
        title={t("result.actions.regenerate")}
        subtitle={t("result.actions.regen_left")}
        icon={RefreshCw}
      />
    </div>
  );
}
