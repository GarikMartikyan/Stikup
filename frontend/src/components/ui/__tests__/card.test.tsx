import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardBody, CardFooter } from "../card";

describe("Card", () => {
  it("renders Card with Header, Body and Footer composition", () => {
    render(
      <Card>
        <CardHeader>Header content</CardHeader>
        <CardBody>Body content</CardBody>
        <CardFooter>Footer content</CardFooter>
      </Card>,
    );

    expect(screen.getByText("Header content")).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
    expect(screen.getByText("Footer content")).toBeInTheDocument();
  });

  it("merges custom className with the base classes on Card", () => {
    const { container } = render(
      <Card className="custom-class">content</Card>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("custom-class");
    // Sanity-check the base class is still applied
    expect(root.className).toContain("rounded-3xl");
  });

  it("merges custom className on CardHeader, CardBody and CardFooter", () => {
    const { container } = render(
      <Card>
        <CardHeader className="hdr">H</CardHeader>
        <CardBody className="bdy">B</CardBody>
        <CardFooter className="ftr">F</CardFooter>
      </Card>,
    );

    const root = container.firstElementChild as HTMLElement;
    const [header, body, footer] = Array.from(root.children) as HTMLElement[];
    expect(header.className).toContain("hdr");
    expect(body.className).toContain("bdy");
    expect(footer.className).toContain("ftr");
  });
});
