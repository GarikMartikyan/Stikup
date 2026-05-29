import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider } from "@/components/language-provider";
import enMessages from "@/i18n/messages/en.json";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

const mockLogin = vi.fn();
vi.mock("@/lib/store/auth-api", () => ({
  useLoginMutation: () => [mockLogin, { isLoading: false }],
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function setup() {
    const { LoginForm } = await import("../login-form");
    return render(
      <LanguageProvider>
        <LoginForm />
      </LanguageProvider>,
    );
  }

  it("renders email and password fields with a submit button", async () => {
    await setup();
    expect(screen.getByLabelText(enMessages.auth.common.email_label)).toBeInTheDocument();
    expect(screen.getByLabelText(enMessages.auth.common.password_label)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: enMessages.auth.login.sign_in })).toBeInTheDocument();
  });

  it("navigates to /my-stickers on successful login", async () => {
    mockLogin.mockReturnValue({ unwrap: () => Promise.resolve(undefined) });
    const user = userEvent.setup();
    await setup();

    await user.type(screen.getByLabelText(enMessages.auth.common.email_label), "test@example.com");
    await user.type(screen.getByLabelText(enMessages.auth.common.password_label), "password123");
    await user.click(screen.getByRole("button", { name: enMessages.auth.login.sign_in }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(mockPush).toHaveBeenCalledWith("/my-stickers");
    });
  });

  it("refreshes the server layout after login so the header updates", async () => {
    mockLogin.mockReturnValue({ unwrap: () => Promise.resolve(undefined) });
    const user = userEvent.setup();
    await setup();

    await user.type(screen.getByLabelText(enMessages.auth.common.email_label), "test@example.com");
    await user.type(screen.getByLabelText(enMessages.auth.common.password_label), "password123");
    await user.click(screen.getByRole("button", { name: enMessages.auth.login.sign_in }));

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("sends the email lowercased", async () => {
    mockLogin.mockReturnValue({ unwrap: () => Promise.resolve(undefined) });
    const user = userEvent.setup();
    await setup();

    await user.type(screen.getByLabelText(enMessages.auth.common.email_label), "TEST@Example.COM");
    await user.type(screen.getByLabelText(enMessages.auth.common.password_label), "password123");
    await user.click(screen.getByRole("button", { name: enMessages.auth.login.sign_in }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({ email: "test@example.com" }),
      );
    });
  });

  it("shows an error message on failed login", async () => {
    mockLogin.mockReturnValue({
      unwrap: () => Promise.reject(new Error("Unauthorized")),
    });
    const user = userEvent.setup();
    await setup();

    await user.type(screen.getByLabelText(enMessages.auth.common.email_label), "bad@example.com");
    await user.type(screen.getByLabelText(enMessages.auth.common.password_label), "wrongpass");
    await user.click(screen.getByRole("button", { name: enMessages.auth.login.sign_in }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        enMessages.auth.login.error_invalid,
      );
    });
  });
});
