import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
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
    return render(<LoginForm />);
  }

  it("renders email and password fields with a submit button", async () => {
    await setup();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("navigates to /dashboard on successful login", async () => {
    mockLogin.mockReturnValue({ unwrap: () => Promise.resolve(undefined) });
    const user = userEvent.setup();
    await setup();

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("sends the email lowercased", async () => {
    mockLogin.mockReturnValue({ unwrap: () => Promise.resolve(undefined) });
    const user = userEvent.setup();
    await setup();

    await user.type(screen.getByLabelText("Email"), "TEST@Example.COM");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

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

    await user.type(screen.getByLabelText("Email"), "bad@example.com");
    await user.type(screen.getByLabelText("Password"), "wrongpass");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Invalid email or password.",
      );
    });
  });
});
