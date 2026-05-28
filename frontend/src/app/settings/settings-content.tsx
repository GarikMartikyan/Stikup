"use client";

import { KeyRound, Languages, Palette, Send, Trash2 } from "lucide-react";

import { DeleteAccountSetting } from "@/components/settings/delete-account-setting";
import { GoogleConnectionSetting } from "@/components/settings/google-connection-setting";
import { LanguageSetting } from "@/components/settings/language-setting";
import { SettingSection } from "@/components/settings/setting-section";
import { TelegramConnectionSetting } from "@/components/settings/telegram-connection-setting";
import { ThemeSetting } from "@/components/settings/theme-setting";
import { useT } from "@/components/language-provider";

export function SettingsContent({ email }: { email: string | null }) {
  const t = useT();

  return (
    <div className="relative flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-5 py-8 md:py-12">
        <header>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight md:text-4xl">
            {t("settings.title")}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            {t("settings.subtitle")}
          </p>
        </header>

        <SettingSection
          icon={Palette}
          title={t("settings.theme.section_title")}
          description={t("settings.theme.section_description")}
        >
          <ThemeSetting />
        </SettingSection>

        <SettingSection
          icon={Languages}
          title={t("settings.language.section_title")}
          description={t("settings.language.section_description")}
        >
          <LanguageSetting />
        </SettingSection>

        <SettingSection
          icon={Send}
          title={t("settings.telegram.section_title")}
          description={t("settings.telegram.section_description")}
        >
          <TelegramConnectionSetting />
        </SettingSection>

        <SettingSection
          icon={KeyRound}
          title={t("settings.google.section_title")}
          description={t("settings.google.section_description")}
        >
          <GoogleConnectionSetting />
        </SettingSection>

        <SettingSection
          id="delete-account"
          icon={Trash2}
          title={t("settings.delete_account.section_title")}
          description={t("settings.delete_account.section_description")}
          danger
        >
          <DeleteAccountSetting email={email} />
        </SettingSection>
      </main>
    </div>
  );
}
