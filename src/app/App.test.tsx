import { render, screen } from "@testing-library/react";
import { App } from "./App";

it("renders the prototype notice", () => {
  render(<App />);
  expect(
    screen.getByText(/protótipo sem gravação permanente/i),
  ).toBeInTheDocument();
});
