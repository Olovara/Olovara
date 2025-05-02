import { AuthEmail } from "./AuthEmail";

interface TwoFactorEmailProps {
  token: string;
}

export const TwoFactorEmail = ({ token }: TwoFactorEmailProps) => {
  return (
    <AuthEmail
      title="Your 2FA Code"
      previewText="Your two-factor authentication code"
      buttonText="Use this code"
      buttonLink="#"
      content={`Your two-factor authentication code is: ${token}\n\nThis code will expire in 5 minutes.`}
    />
  );
}; 