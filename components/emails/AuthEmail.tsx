import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface AuthEmailProps {
  title: string;
  previewText: string;
  buttonText: string;
  buttonLink: string;
  content: string;
}

export const AuthEmail = ({
  title,
  previewText,
  buttonText,
  buttonLink,
  content,
}: AuthEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>OLOVARA</Text>
          </Section>
          <Section style={contentSection}>
            <Text style={heading}>{title}</Text>
            <Text style={paragraph}>{content}</Text>
            <Button style={button} href={buttonLink}>
              {buttonText}
            </Button>
          </Section>
          <Section style={footerSection}>
            <Text style={footerText}>
              If you didn&apos;t request this email, you can safely ignore it.
            </Text>
            <Text style={copyrightText}>
              © 2025 OLOVARA. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "580px",
};

const logoSection = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const logoText = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#000000",
};

const contentSection = {
  padding: "24px",
  backgroundColor: "#f9f9f9",
  borderRadius: "8px",
};

const heading = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#000000",
  marginBottom: "16px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#333333",
  marginBottom: "24px",
};

const button = {
  backgroundColor: "#7C3AED",
  borderRadius: "4px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px",
  width: "100%",
};

const footerSection = {
  marginTop: "32px",
  textAlign: "center" as const,
};

const footerText = {
  fontSize: "14px",
  color: "#666666",
  marginBottom: "8px",
};

const copyrightText = {
  fontSize: "12px",
  color: "#666666",
}; 