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

interface SellerApplicationWelcomeEmailProps {
  sellerDisplayName: string;
}

export const SellerApplicationWelcomeEmail = ({
  sellerDisplayName,
}: SellerApplicationWelcomeEmailProps) => {
  const previewText =
    "A quick note from Simeon welcome to Olovara and thanks for applying";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to Olovara</Heading>

          <Section style={section}>
            <Text style={text}>Hi {sellerDisplayName},</Text>

            <Text style={text}>
              My name is Simeon and I&apos;m the founder of Olovara. We started
              Olovara because we wanted a better handmade marketplace for
              makers, something that is easy to use so you spend less time on
              admin and more time making and something that actually stands for handmade.
            </Text>

            <Text style={text}>
              If you need any help or want to share why you signed up, hit reply
              and let me know. I read every email.
            </Text>

            <Text style={signoff}>
              Thanks,
              <br />
              Simeon
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

const signoff = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "28px 0 0",
};

export default SellerApplicationWelcomeEmail;
