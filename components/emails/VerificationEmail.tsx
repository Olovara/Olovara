import { AuthEmail } from "./AuthEmail";

interface VerificationEmailProps {
  confirmLink: string;
}

export const VerificationEmail = ({ confirmLink }: VerificationEmailProps) => {
  return (
    <AuthEmail
      title="Verify your email"
      previewText="Please verify your email address"
      buttonText="Verify Email"
      buttonLink={confirmLink}
      content="Thank you for signing up! Please click the button below to verify your email address and complete your registration."
    />
  );
}; 