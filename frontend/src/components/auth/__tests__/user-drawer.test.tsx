import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LanguageProvider } from "@/components/language-provider";
import enMessages from "@/i18n/messages/en.json";

let mockMe:
  | { userId: string; email: string | null; displayName: string | null; avatarUrl: string | null; channels: { channel: string }[] }
  | undefined;

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/store/auth-api", () => ({
  useGetMeQuery: () => ({ data: mockMe, error: undefined }),
  useLogoutMutation: () => [vi.fn(), { isLoading: false }],
}));

function setMe(channels: string[]) {
  mockMe = {
    userId: "abcdef12-3456-7890-abcd-ef1234567890",
    email: "user@example.com",
    displayName: "Test User",
    avatarUrl: null,
    channels: channels.map((channel) => ({ channel })),
  };
}

async function setup() {
  const { UserDrawer } = await import("../user-drawer");
  return render(
    <LanguageProvider>
      <UserDrawer />
    </LanguageProvider>,
  );
}

describe("UserDrawer connect nudge", () => {
  beforeEach(() => {
    mockMe = undefined;
  });

  it("shows the connect reminder when a provider is unlinked", async () => {
    setMe(["telegram"]);
    await setup();
    expect(screen.getByText(enMessages.header.connect_reminder)).toBeInTheDocument();
  });

  it("hides the connect reminder when both providers are linked", async () => {
    setMe(["telegram", "google"]);
    await setup();
    expect(screen.queryByText(enMessages.header.connect_reminder)).not.toBeInTheDocument();
  });
});

describe("UserDrawer sign-out visibility", () => {
  beforeEach(() => {
    mockMe = undefined;
  });

  it("renders the Sign out action by default", async () => {
    setMe(["telegram", "google"]);
    const { UserDrawer } = await import("../user-drawer");
    render(
      <LanguageProvider>
        <UserDrawer />
      </LanguageProvider>,
    );
    expect(
      await screen.findByText(enMessages.auth.user_drawer.sign_out),
    ).toBeInTheDocument();
  });

  it("hides the Sign out action when hideSignOut is set (Telegram Mini App)", async () => {
    setMe(["telegram", "google"]);
    const { UserDrawer } = await import("../user-drawer");
    render(
      <LanguageProvider>
        <UserDrawer hideSignOut />
      </LanguageProvider>,
    );
    // The drawer body still mounts (the account name renders)…
    expect(await screen.findByText("Test User")).toBeInTheDocument();
    // …but the Sign out action is gone.
    expect(
      screen.queryByText(enMessages.auth.user_drawer.sign_out),
    ).not.toBeInTheDocument();
  });
});
