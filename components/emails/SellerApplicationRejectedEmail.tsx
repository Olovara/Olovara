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

interface SellerApplicationRejectedEmailProps {
  sellerName: string;
  sellerEmail: string;
  applicationUrl: string;
  rejectionReason?: string;
}

export const SellerApplicationRejectedEmail = ({
  sellerName,
  sellerEmail,
  applicationUrl,
  rejectionReason,
}: SellerApplicationRejectedEmailProps) => {
  const previewText = `Update on your seller application`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Application Update</Heading>
          
          <Section style={section}>
            <Text style={text}>
              Hello {sellerName},
            </Text>
            
            <Text style={text}>
              Thank you for your interest in becoming a seller on OLOVARA. After careful review of your application, 
              we regret to inform you that we are unable to approve your seller application at this time.
            </Text>
            
            {rejectionReason && (
              <Section style={reasonSection}>
                <Text style={reasonTitle}>
                  <strong>Reason for Rejection:</strong>
                </Text>
                <Text style={reasonText}>
                  {rejectionReason}
                </Text>
              </Section>
            )}
            
            <Text style={text}>
              This decision was made based on our current marketplace guidelines and requirements. 
              We encourage you to review our seller guidelines and consider applying again in the future 
              if you believe your application meets our criteria.
            </Text>
            
            <Section style={infoSection}>
              <Text style={infoText}>
                <strong>What you can do:</strong>
              </Text>
              <Text style={infoText}>
                • Review our seller guidelines and requirements
              </Text>
              <Text style={infoText}>
                • Ensure your application includes all required information
              </Text>
              <Text style={infoText}>
                • Consider applying again in the future
              </Text>
              <Text style={infoText}>
                • Contact our support team if you have questions
              </Text>
            </Section>
            
            <Text style={text}>
              We appreciate your interest in our handmade marketplace and wish you the best in your future endeavors.
            </Text>
            
            <Section style={buttonSection}>
              <Link href={applicationUrl} style={button}>
                View Seller Guidelines
              </Link>
            </Section>
            
            <Text style={footerText}>
              Thank you for your understanding. We&apos;re here to help if you need any clarification.
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

const reasonSection = {
  backgroundColor: "#fff3cd",
  padding: "16px",
  borderRadius: "6px",
  margin: "20px 0",
  border: "1px solid #ffeaa7",
};

const reasonTitle = {
  color: "#856404",
  fontSize: "14px",
  fontWeight: "bold",
  margin: "0 0 8px 0",
};

const reasonText = {
  color: "#856404",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
  fontStyle: "italic",
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
  backgroundColor: "#6c757d",
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

export default SellerApplicationRejectedEmail; 