import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface SellerApplicationInformationRequestEmailProps {
  sellerName: string;
  sellerEmail: string;
  applicationUrl: string;
  requestMessage: string;
}

export const SellerApplicationInformationRequestEmail = ({
  sellerName,
  sellerEmail,
  applicationUrl,
  requestMessage,
}: SellerApplicationInformationRequestEmailProps) => {
  const previewText = `Additional information needed for your seller application`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Additional Information Needed</Heading>

          <Section style={section}>
            <Text style={text}>Hello {sellerName},</Text>

            <Text style={text}>
              Thank you for your interest in becoming a seller on OLOVARA.
              We&apos;ve reviewed your application and need some additional
              information to complete our review process.
            </Text>

            <Section style={requestSection}>
              <Text style={requestTitle}>
                <strong>Information Requested:</strong>
              </Text>
              <Text style={requestText}>{requestMessage}</Text>
            </Section>

            <Text style={text}>
              Please provide this information as soon as possible so we can
              continue reviewing your application. You can reply directly to
              this email with the requested information.
            </Text>

            <Section style={infoSection}>
              <Text style={infoText}>
                <strong>What you can do:</strong>
              </Text>
              <Text style={infoText}>
                • Reply to this email with the requested information
              </Text>
              <Text style={infoText}>
                • Contact our support team if you have questions
              </Text>
            </Section>

            <Text style={text}>
              We&apos;re here to help you through the application process. If
              you have any questions or need clarification on what we&apos;re
              requesting, please don&apos;t hesitate to reach out.
            </Text>

            <Text style={footerText}>
              Thank you for your patience. We look forward to reviewing your
              complete application.
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
  maxWidth: "560px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
  textAlign: "center" as const,
};

const section = {
  padding: "24px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  border: "1px solid #e1e5e9",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const requestSection = {
  backgroundColor: "#f3e5f5",
  padding: "16px",
  borderRadius: "6px",
  margin: "20px 0",
  border: "1px solid #ce93d8",
};

const requestTitle = {
  color: "#7b1fa2",
  fontSize: "14px",
  fontWeight: "bold",
  margin: "0 0 8px 0",
};

const requestText = {
  color: "#7b1fa2",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
};

const infoSection = {
  backgroundColor: "#f8f9fa",
  padding: "16px",
  borderRadius: "6px",
  margin: "20px 0",
  border: "1px solid #e9ecef",
};

const infoText = {
  color: "#495057",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#9c27b0",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const footerText = {
  color: "#6c757d",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "24px 0 0",
  fontStyle: "italic",
};

export default SellerApplicationInformationRequestEmail;
