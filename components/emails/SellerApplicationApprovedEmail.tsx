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

interface SellerApplicationApprovedEmailProps {
  sellerName: string;
  sellerEmail: string;
  dashboardUrl: string;
}

export const SellerApplicationApprovedEmail = ({
  sellerName,
  sellerEmail,
  dashboardUrl,
}: SellerApplicationApprovedEmailProps) => {
  const previewText = `Congratulations! Your seller application has been approved`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🎉 Application Approved!</Heading>
          
          <Section style={section}>
            <Text style={text}>
              Hello {sellerName},
            </Text>
            
            <Text style={text}>
              Great news! Your seller application has been reviewed and <strong>approved</strong>. 
              You&apos;re now ready to start setting up your shop and selling your handmade items on OLOVARA.
            </Text>
            
            <Section style={infoSection}>
              <Text style={infoText}>
                <strong>Next Steps:</strong>
              </Text>
              <Text style={infoText}>
                1. Complete your shop profile with business information
              </Text>
              <Text style={infoText}>
                2. Connect your Stripe account for payments
              </Text>
              <Text style={infoText}>
                3. Set up your shipping profiles
              </Text>
              <Text style={infoText}>
                4. Start creating and listing your products
              </Text>
            </Section>
            
            <Text style={text}>
              You can access your seller dashboard to complete the onboarding process and start selling right away.
            </Text>
            
            <Section style={buttonSection}>
              <Link href={dashboardUrl} style={button}>
                Go to Seller Dashboard
              </Link>
            </Section>
            
            <Text style={text}>
              If you have any questions during the setup process, don&apos;t hesitate to reach out to our support team.
            </Text>
            
            <Text style={footerText}>
              Welcome to the OLOVARA seller community! We&apos;re excited to see your handmade creations.
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

export default SellerApplicationApprovedEmail; 