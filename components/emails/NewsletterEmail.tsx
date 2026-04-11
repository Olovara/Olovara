import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
  Hr,
} from "@react-email/components";

interface NewsletterEmailProps {
  subject: string;
  content: string;
  unsubscribeUrl?: string;
  previewText?: string;
}

export default function NewsletterEmail({ 
  subject, 
  content, 
  unsubscribeUrl = "#",
  previewText 
}: NewsletterEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText || subject}</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container style={container}>
            {/* Header */}
            <Section className="text-center py-8">
              <Text className="text-2xl font-bold text-gray-900 mb-2">
                OLOVARA
              </Text>
              <Text className="text-sm text-gray-600">
                Handmade with love, delivered with care
              </Text>
            </Section>

            <Hr className="border-gray-200" />

            {/* Main Content */}
            <Section className="py-8">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </Section>

            <Hr className="border-gray-200" />

            {/* Footer */}
            <Section className="py-6 text-center">
              <Text className="text-sm text-gray-600 mb-4">
                Thank you for being part of our community!
              </Text>
              
              <div className="space-y-2">
                <Text className="text-xs text-gray-500">
                  You received this email because you subscribed to our newsletter.
                </Text>
                
                {unsubscribeUrl && (
                  <Button
                    href={unsubscribeUrl}
                    className="text-xs text-gray-500 underline hover:text-gray-700"
                    style={{ background: 'none', border: 'none', padding: 0 }}
                  >
                    Unsubscribe
                  </Button>
                )}
              </div>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "600px",
}; 