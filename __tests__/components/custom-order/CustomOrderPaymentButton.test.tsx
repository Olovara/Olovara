import React from "react";
import { render, screen } from "@testing-library/react";
import CustomOrderPaymentButton from "@/components/custom-order/CustomOrderPaymentButton";

describe("CustomOrderPaymentButton", () => {
  const defaultProps = {
    submissionId: "submission-123",
    paymentType: "MATERIALS_DEPOSIT" as const,
    amount: 2500,
    currency: "USD",
  };

  it("renders a link to the custom-order checkout page with encoded params", () => {
    render(<CustomOrderPaymentButton {...defaultProps} />);

    const link = screen.getByRole("link", { name: /Continue to checkout/ });
    expect(link).toHaveAttribute(
      "href",
      "/checkout/custom-order/submission-123?paymentType=MATERIALS_DEPOSIT",
    );
    expect(screen.getByText(/\$25\.00/)).toBeInTheDocument();
  });

  it("renders final payment link with FINAL_PAYMENT type", () => {
    render(
      <CustomOrderPaymentButton
        {...defaultProps}
        paymentType="FINAL_PAYMENT"
        amount={7500}
      />,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "/checkout/custom-order/submission-123?paymentType=FINAL_PAYMENT",
    );
    expect(screen.getByText(/\$75\.00/)).toBeInTheDocument();
  });

  it("respects disabled prop (no link, button disabled)", () => {
    render(<CustomOrderPaymentButton {...defaultProps} disabled={true} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    const button = screen.getByRole("button", { name: /Continue to checkout/ });
    expect(button).toBeDisabled();
  });

  it("applies custom className to the wrapper", () => {
    render(<CustomOrderPaymentButton {...defaultProps} className="custom-class" />);

    const wrapper = screen.getByText(/Continue to checkout/).closest(".custom-class");
    expect(wrapper).not.toBeNull();
  });

  it("formats different currencies correctly", () => {
    render(
      <CustomOrderPaymentButton
        {...defaultProps}
        currency="EUR"
        amount={2500}
      />,
    );

    expect(screen.getByText(/€25\.00/)).toBeInTheDocument();
  });

  it("formats JPY in checkout label (amount passed as cents)", () => {
    render(
      <CustomOrderPaymentButton
        {...defaultProps}
        currency="JPY"
        amount={3000}
      />,
    );

    expect(screen.getByText(/¥30/)).toBeInTheDocument();
  });
});
