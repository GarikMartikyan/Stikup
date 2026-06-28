import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/sound", () => ({ fireSound: vi.fn() }));

import { fireSound } from "@/lib/sound";
import { SoundClickListener } from "../sound-click-listener";

describe("SoundClickListener", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("fires the tap sound when a button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <>
        <SoundClickListener />
        <button>Go</button>
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Go" }));
    expect(fireSound).toHaveBeenCalledWith("tap");
  });

  it("fires when clicking an element nested inside a button", async () => {
    const user = userEvent.setup();
    render(
      <>
        <SoundClickListener />
        <button>
          <span>Inner</span>
        </button>
      </>,
    );
    await user.click(screen.getByText("Inner"));
    expect(fireSound).toHaveBeenCalledWith("tap");
  });

  it("fires for an element with role=button", async () => {
    const user = userEvent.setup();
    render(
      <>
        <SoundClickListener />
        <div role="button" tabIndex={0}>
          Div button
        </div>
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Div button" }));
    expect(fireSound).toHaveBeenCalledWith("tap");
  });

  it("does NOT fire for a plain link", async () => {
    const user = userEvent.setup();
    render(
      <>
        <SoundClickListener />
        <a href="#test">A link</a>
      </>,
    );
    await user.click(screen.getByText("A link"));
    expect(fireSound).not.toHaveBeenCalled();
  });

  it("does NOT fire for a disabled button", () => {
    render(
      <>
        <SoundClickListener />
        <button disabled>Nope</button>
      </>,
    );
    // fireEvent forces the click even though a disabled button wouldn't emit one
    // from a real user — this exercises the guard directly.
    fireEvent.click(screen.getByRole("button", { name: "Nope" }));
    expect(fireSound).not.toHaveBeenCalled();
  });

  it("removes its listener on unmount", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <>
        <SoundClickListener />
        <button>Go</button>
      </>,
    );
    unmount();
    // The button is gone with the tree; render a fresh standalone button and
    // confirm no stray listener fires.
    render(<button>Lonely</button>);
    await user.click(screen.getByRole("button", { name: "Lonely" }));
    expect(fireSound).not.toHaveBeenCalled();
  });
});
