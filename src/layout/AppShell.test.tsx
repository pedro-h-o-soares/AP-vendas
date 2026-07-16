import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AppShell } from "./AppShell";
import { MobileNav } from "./MobileNav";

describe("responsive navigation", () => {
  it("toggles the desktop sidebar", async () => {
    const user = userEvent.setup();

    render(
      <AppShell>
        <div>Conteúdo</div>
      </AppShell>,
    );

    await user.click(
      screen.getByRole("button", { name: /recolher menu/i }),
    );

    expect(
      screen.getByRole("navigation", { name: /principal/i }),
    ).toHaveAttribute("data-collapsed", "true");
  });

  it("contains the five primary mobile destinations", () => {
    render(<MobileNav />);

    expect(screen.getAllByRole("link")).toHaveLength(5);
  });
});
