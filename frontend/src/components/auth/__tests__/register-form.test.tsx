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

const mockRegister = vi.fn();
vi.mock("@/lib/store/auth-api", () => ({
  useRegisterMutation: () => [mockRegister, { isLoading: false }],
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function setup() {
    const { RegisterForm } = await import("../register-form");
    return render(
      <LanguageProvider>
        <RegisterForm />
      </LanguageProvider>,
    );
  }

  it("renders email, password and a submit button", async () => {
    await setup();
    expect(screen.getByLabelText(enMessages.auth.common.email_label)).toBeInTheDocument();
    expect(screen.getByLabelText(enMessages.auth.common.password_label)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: enMessages.auth.register.create_account }),
    ).toBeInTheDocument();
  });

  it("shows a password hint when password is too short", async () => {
    const user = userEvent.setup();
    await setup();

    await user.type(screen.getByLabelText(enMessages.auth.common.email_label), "new@example.com");
    await user.type(screen.getByLabelText(enMessages.auth.common.password_label), "short");

    expect(screen.getByText(enMessages.auth.register.password_hint)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: enMessages.auth.register.create_account })).toBeDisabled();
    expect(mockRegister).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("navigates to /my-stickers on successful registration", async () => {
    mockRegister.mockReturnValue({ unwrap: () => Promise.resolve(undefined) });
    const user = userEvent.setup();
    await setup();

    await user.type(screen.getByLabelText(enMessages.auth.common.email_label), "new@example.com");
    await user.type(screen.getByLabelText(enMessages.auth.common.password_label), "password123");
    await user.type(screen.getByLabelText(enMessages.auth.register.confirm_password_label), "password123");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: enMessages.auth.register.create_account }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/my-stickers");
    });
  });

  it("refreshes the server layout after registration so the header updates", async () => {
    mockRegister.mockReturnValue({ unwrap: () => Promise.resolve(undefined) });
    const user = userEvent.setup();
    await setup();

    await user.type(screen.getByLabelText(enMessages.auth.common.email_label), "new@example.com");
    await user.type(screen.getByLabelText(enMessages.auth.common.password_label), "password123");
    await user.type(screen.getByLabelText(enMessages.auth.register.confirm_password_label), "password123");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: enMessages.auth.register.create_account }));

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("shows conflict error message on 409", async () => {
    mockRegister.mockReturnValue({
      unwrap: () => Promise.reject({ status: 409 }),
    });
    const user = userEvent.setup();
    await setup();

    await user.type(screen.getByLabelText(enMessages.auth.common.email_label), "existing@example.com");
    await user.type(screen.getByLabelText(enMessages.auth.common.password_label), "password123");
    await user.type(screen.getByLabelText(enMessages.auth.register.confirm_password_label), "password123");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: enMessages.auth.register.create_account }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        enMessages.auth.register.error_conflict,
      );
    });
  });

  it("shows generic error on other failures", async () => {
    mockRegister.mockReturnValue({
      unwrap: () => Promise.reject({ status: 500 }),
    });
    const user = userEvent.setup();
    await setup();

    await user.type(screen.getByLabelText(enMessages.auth.common.email_label), "test@example.com");
    await user.type(screen.getByLabelText(enMessages.auth.common.password_label), "password123");
    await user.type(screen.getByLabelText(enMessages.auth.register.confirm_password_label), "password123");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: enMessages.auth.register.create_account }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        enMessages.auth.register.error_failed,
      );
    });
  });
});
