import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
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
    return render(<RegisterForm />);
  }

  it("renders email, password and a submit button", async () => {
    await setup();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create account" }),
    ).toBeInTheDocument();
  });

  it("shows a client-side error when password is too short", async () => {
    const user = userEvent.setup();
    await setup();

    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Password must be at least 8 characters.",
    );
    expect(mockRegister).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("navigates to /dashboard on successful registration", async () => {
    mockRegister.mockReturnValue({ unwrap: () => Promise.resolve(undefined) });
    const user = userEvent.setup();
    await setup();

    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows conflict error message on 409", async () => {
    mockRegister.mockReturnValue({
      unwrap: () => Promise.reject({ status: 409 }),
    });
    const user = userEvent.setup();
    await setup();

    await user.type(screen.getByLabelText("Email"), "existing@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "An account with that email already exists.",
      );
    });
  });

  it("shows generic error on other failures", async () => {
    mockRegister.mockReturnValue({
      unwrap: () => Promise.reject({ status: 500 }),
    });
    const user = userEvent.setup();
    await setup();

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Registration failed. Please try again.",
      );
    });
  });
});
