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

interface ContactResponseEmailProps {
  customerName: string;
  originalMessage: string;
  adminResponse: string;
  reason: string;
}

export const ContactResponseEmail = ({
  customerName,
  originalMessage,
  adminResponse,
  reason,
}: ContactResponseEmailProps) => {
  const previewText = `Response to your ${reason.toLowerCase()} inquiry`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Response to Your Inquiry</Heading>
          
          <Section style={section}>
            <Text style={text}>
              Hello {customerName},
            </Text>
            
            <Text style={text}>
              Thank you for reaching out to us. We&apos;ve received your inquiry regarding <strong>{reason}</strong> and wanted to follow up with you.
            </Text>
            
            <Section style={originalMessageSection}>
              <Text style={sectionTitle}>Your Original Message:</Text>
              <Text style={originalMessageText}>
                {originalMessage}
              </Text>
            </Section>
            
            <Section style={responseSection}>
              <Text style={sectionTitle}>Our Response:</Text>
              <Text style={responseText}>
                {adminResponse}
              </Text>
            </Section>
            
            <Text style={text}>
              If you have any additional questions or concerns, please don&apos;t hesitate to reach out to us again. We&apos;re here to help!
            </Text>
            
            <Text style={footerText}>
              Best regards,<br />
              The OLOVARA Support Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#ffffff",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "560px",
};

const h1 = {
  color: "#333",
  fontSize: "28px",
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

const originalMessageSection = {
  backgroundColor: "#f8f9fa",
  padding: "16px",
  borderRadius: "6px",
  margin: "20px 0",
  border: "1px solid #e9ecef",
};

const sectionTitle = {
  color: "#495057",
  fontSize: "14px",
  fontWeight: "bold",
  margin: "0 0 8px 0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const originalMessageText = {
  color: "#495057",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0",
  whiteSpace: "pre-wrap" as const,
};

const responseSection = {
  backgroundColor: "#f3e8ff", // Light purple background
  padding: "16px",
  borderRadius: "6px",
  margin: "20px 0",
  border: "1px solid #8b5cf6", // Purple border
};

const responseText = {
  color: "#333",
  fontSize: "15px",
  lineHeight: "22px",
  margin: "8px 0",
  whiteSpace: "pre-wrap" as const,
};

const footerText = {
  color: "#6c757d",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "24px 0 0",
  fontStyle: "italic",
};

export default ContactResponseEmail;

