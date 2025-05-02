import { AuthEmail } from "./AuthEmail";

interface PasswordResetEmailProps {
  resetLink: string;
}

export const PasswordResetEmail = ({ resetLink }: PasswordResetEmailProps) => {
  return (
    <AuthEmail
      title="Reset your password"
      previewText="Reset your Yarnnu password"
      buttonText="Reset Password"
      buttonLink={resetLink}
      content="We received a request to reset your password. Click the button below to create a new password. This link will expire in 1 hour."
    />
  );
}; 