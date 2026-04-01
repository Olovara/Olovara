import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface CustomOrderRejectionEmailProps {
  buyerName: string;
  shopName: string;
  formTitle: string;
  rejectionReason: string;
}

export const CustomOrderRejectionEmail = ({
  buyerName,
  shopName,
  formTitle,
  rejectionReason,
}: CustomOrderRejectionEmailProps) => {
  const previewText = `Update on your custom order request from ${shopName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Custom order request update</Heading>

          <Section style={section}>
            <Text style={text}>Hello {buyerName},</Text>

            <Text style={text}>
              {shopName} has declined your custom order request
              {formTitle ? ` (“${formTitle}”)` : ""} on Yarnnu.
            </Text>

            <Section style={reasonSection}>
              <Text style={reasonTitle}>
                <strong>Message from the seller:</strong>
              </Text>
              <Text style={reasonText}>{rejectionReason}</Text>
            </Section>

            <Text style={text}>
              If you have questions, please message the
              seller from your Yarnnu account.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.3",
  margin: "16px 0",
  padding: "0 40px",
};

const section = {
  padding: "0 40px",
};

const text = {
  color: "#444",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "16px 0",
};

const reasonSection = {
  backgroundColor: "#f4f4f5",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "24px 0",
};

const reasonTitle = {
  color: "#1a1a1a",
  fontSize: "14px",
  margin: "0 0 8px",
};

const reasonText = {
  color: "#333",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
};
