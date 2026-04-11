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
import { formatPriceInCurrency } from "@/lib/utils";

interface CustomOrderQuoteEmailProps {
  buyerName: string;
  shopName: string;
  formTitle: string;
  currency: string;
  quotePriceType: "FIXED" | "RANGE";
  quotePriceFixedMinor: number | null;
  quotePriceMinMinor: number | null;
  quotePriceMaxMinor: number | null;
  quoteDepositMinor: number;
  quoteTimeline: string;
  quoteNotes: string | null;
}

/** Formats stored minor units for the buyer email (same rules as storefront pricing). */
function money(minor: number | null, currency: string): string {
  if (minor == null) return "—";
  return formatPriceInCurrency(minor, currency, true);
}

export const CustomOrderQuoteEmail = ({
  buyerName,
  shopName,
  formTitle,
  currency,
  quotePriceType,
  quotePriceFixedMinor,
  quotePriceMinMinor,
  quotePriceMaxMinor,
  quoteDepositMinor,
  quoteTimeline,
  quoteNotes,
}: CustomOrderQuoteEmailProps) => {
  const previewText = `${shopName} sent you a price estimate for your custom order`;

  const estimateLine =
    quotePriceType === "FIXED"
      ? money(quotePriceFixedMinor, currency)
      : `${money(quotePriceMinMinor, currency)} – ${money(quotePriceMaxMinor, currency)}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Custom order quote</Heading>

          <Section style={section}>
            <Text style={text}>Hello {buyerName},</Text>

            <Text style={text}>
              {shopName} reviewed your request
              {formTitle ? ` (“${formTitle}”)` : ""} on OLOVARA and sent a quote.
            </Text>

            <Section style={box}>
              <Text style={label}>Price estimate</Text>
              <Text style={value}>{estimateLine}</Text>

              <Text style={label}>Required deposit</Text>
              <Text style={value}>{money(quoteDepositMinor, currency)}</Text>

              <Text style={label}>Timeline</Text>
              <Text style={value}>{quoteTimeline}</Text>

              {quoteNotes?.trim() ? (
                <>
                  <Text style={label}>Notes from the seller</Text>
                  <Text style={{ ...value, whiteSpace: "pre-wrap" }}>
                    {quoteNotes.trim()}
                  </Text>
                </>
              ) : null}
            </Section>

            <Text style={text}>
              Sign in to OLOVARA to view the full request and reply to the seller
              if you have questions.
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

const box = {
  backgroundColor: "#f4f4f5",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "24px 0",
};

const label = {
  color: "#666",
  fontSize: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "12px 0 4px",
};

const value = {
  color: "#1a1a1a",
  fontSize: "16px",
  lineHeight: "1.5",
  margin: "0 0 4px",
};
