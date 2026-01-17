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
} from "@react-email/components";

interface SellerOrderEmailProps {
  orderDetails: {
    productName: string;
    orderId: string;
    batchNumber?: string;
    quantity: number;
    totalAmount: number;
    shippingAddress?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    buyerName?: string;
    orderInstructions?: string; // Order instructions from buyer
  };
}

export default function SellerOrderEmail({ orderDetails }: SellerOrderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New Sale Alert! Order #{orderDetails.orderId}</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container style={container}>
            <Text className="text-2xl font-semibold">Congratulations!</Text>
            
            <Text className="text-lg text-gray-600">
              You have received a new order on Yarnnu!
            </Text>

            <Section className="mt-6">
              <Text className="text-lg font-medium">Order Details:</Text>
              <Text className="text-gray-600">
                Product: {orderDetails.productName}
              </Text>
              <Text className="text-gray-600">
                Order ID: {orderDetails.orderId}
              </Text>
              {orderDetails.batchNumber && (
                <Text className="text-gray-600">
                  Batch Number: {orderDetails.batchNumber}
                </Text>
              )}
              <Text className="text-gray-600">
                Quantity: {orderDetails.quantity}
              </Text>
              <Text className="text-gray-600">
                Total Amount: ${(orderDetails.totalAmount / 100).toFixed(2)}
              </Text>
              {orderDetails.buyerName && (
                <Text className="text-gray-600">
                  Buyer: {orderDetails.buyerName}
                </Text>
              )}
            </Section>

            {orderDetails.shippingAddress && (
              <Section className="mt-6">
                <Text className="text-lg font-medium">Shipping Information:</Text>
                <Text className="text-gray-600">
                  {orderDetails.shippingAddress.street}
                </Text>
                <Text className="text-gray-600">
                  {orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.state} {orderDetails.shippingAddress.zipCode}
                </Text>
                <Text className="text-gray-600">
                  {orderDetails.shippingAddress.country}
                </Text>
              </Section>
            )}

            {orderDetails.orderInstructions && orderDetails.orderInstructions.trim() && (
              <Section className="mt-6">
                <Text className="text-lg font-medium">Order Instructions / Personalization:</Text>
                <Text className="text-gray-600 whitespace-pre-wrap bg-purple-50 p-4 rounded border border-purple-200">
                  {orderDetails.orderInstructions}
                </Text>
              </Section>
            )}

            {/*<Section className="mt-6">
              <Text className="text-gray-600">
                Please package and ship this order as soon as possible. Don&apos;t forget to update the tracking information in your Yarnnu dashboard.
              </Text>
            </Section> */}

            <Text className="text-lg mt-6">
              Best regards, <br /> The Yarnnu Team
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
}; 