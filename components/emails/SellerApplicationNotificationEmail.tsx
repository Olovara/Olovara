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

interface SellerApplicationNotificationEmailProps {
  adminName: string;
  applicantName: string;
  applicantEmail: string;
  applicationId: string;
  adminDashboardUrl: string;
}

export const SellerApplicationNotificationEmail = ({
  adminName,
  applicantName,
  applicantEmail,
  applicationId,
  adminDashboardUrl,
}: SellerApplicationNotificationEmailProps) => {
  const previewText = `New seller application from ${applicantName} requires review`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New Seller Application</Heading>
          
          <Section style={section}>
            <Text style={text}>
              Hello {adminName},
            </Text>
            
            <Text style={text}>
              A new seller application has been submitted and requires your review.
            </Text>
            
            <Section style={infoSection}>
              <Text style={infoText}>
                <strong>Applicant:</strong> {applicantName}
              </Text>
              <Text style={infoText}>
                <strong>Email:</strong> {applicantEmail}
              </Text>
              <Text style={infoText}>
                <strong>Application ID:</strong> {applicationId}
              </Text>
              <Text style={infoText}>
                <strong>Submitted:</strong> {new Date().toLocaleDateString()}
              </Text>
            </Section>
            
            <Text style={text}>
              Please review this application in the admin dashboard and take appropriate action.
            </Text>
            
            <Section style={buttonSection}>
              <Link href={adminDashboardUrl} style={button}>
                Review Application
              </Link>
            </Section>
            
            <Text style={footerText}>
              This notification was sent because you have seller application notifications enabled.
              You can manage your notification preferences in your admin settings.
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
  backgroundColor: "#8b5cf6",
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

export default SellerApplicationNotificationEmail; 