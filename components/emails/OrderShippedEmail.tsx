import {
  Body,
  Button,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export type OrderShippedEmailProps = {
  productName: string;
  orderId: string;
  shopName: string;
  trackingUrl: string | null;
  trackingNumber: string;
  carrier: string;
  shippingService?: string | null;
  estimatedDeliveryDate?: string | null;
};

export default function OrderShippedEmail({
  productName,
  orderId,
  shopName,
  trackingUrl,
  trackingNumber,
  carrier,
  shippingService,
  estimatedDeliveryDate,
}: OrderShippedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your order from {shopName} has shipped</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Text className="text-2xl font-semibold">Your order is on the way</Text>
          <Text className="text-lg text-gray-600">
            {shopName} has shipped your order.
          </Text>
          <Section className="mt-4">
            <Text className="text-gray-700">
              <strong>Item:</strong> {productName}
            </Text>
            <Text className="text-gray-700">
              <strong>Order ID:</strong> {orderId}
            </Text>
            <Text className="text-gray-700">
              <strong>Carrier:</strong> {carrier}
            </Text>
            <Text className="text-gray-700">
              <strong>Tracking number:</strong> {trackingNumber}
            </Text>
            {shippingService ? (
              <Text className="text-gray-700">
                <strong>Service:</strong> {shippingService}
              </Text>
            ) : null}
            {estimatedDeliveryDate ? (
              <Text className="text-gray-700">
                <strong>Estimated delivery:</strong> {estimatedDeliveryDate}
              </Text>
            ) : null}
          </Section>
          {trackingUrl ? (
            <Section className="mt-6">
              <Button
                href={trackingUrl}
                className="rounded-lg bg-purple-500 px-10 py-4 text-white"
              >
                Track your package
              </Button>
              <Text className="mt-2 text-sm text-gray-500">
                Or copy: <Link href={trackingUrl}>{trackingUrl}</Link>
              </Text>
            </Section>
          ) : (
            <Text className="mt-4 text-sm text-gray-500">
              Enter your tracking number on the carrier&apos;s website to see live
              status.
            </Text>
          )}
        </Body>
      </Tailwind>
    </Html>
  );
}
