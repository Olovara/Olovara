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
  
  interface ProductEmailProps {
    link?: string;
    isDigital: boolean;
    orderDetails?: {
      productName: string;
      orderId: string;
      batchNumber?: string;
      shippingAddress?: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
      };
      estimatedDelivery?: string;
    };
  }
  
  export default function ProductEmail({ link, isDigital, orderDetails }: ProductEmailProps) {
    return (
      <Html>
        <Head />
        <Preview>{isDigital ? "Your digital product is ready!" : "Your order has been confirmed!"}</Preview>
        <Tailwind>
          <Body className="bg-white font-sans">
            <Container style={container}>
              <Text className="text-2xl font-semibold">Hi there,</Text>
              
              <Text className="text-lg text-gray-600">
                Thank you for your purchase at OLOVARA!
              </Text>

              <Section className="mt-6">
                <Text className="text-lg font-medium">Order Details:</Text>
                <Text className="text-gray-600">
                  Product: {orderDetails?.productName}
                </Text>
                <Text className="text-gray-600">
                  Order ID: {orderDetails?.orderId}
                </Text>
                {orderDetails?.batchNumber && (
                  <Text className="text-gray-600">
                    Batch Number: {orderDetails.batchNumber}
                  </Text>
                )}
              </Section>

              {isDigital ? (
                <Section className="mt-6">
                  <Text className="text-lg font-medium">Your digital product is ready!</Text>
                  <Text className="text-gray-600 mb-4">
                    Click the button below to download your product.
                  </Text>
                  <Button
                    href={link}
                    className="text-white bg-purple-500 rounded-lg px-10 py-4"
                  >
                    Download Now
                  </Button>
                </Section>
              ) : (
                <Section className="mt-6">
                  <Text className="text-lg font-medium">Shipping Information:</Text>
                  <Text className="text-gray-600">
                    {orderDetails?.shippingAddress?.street}
                  </Text>
                  <Text className="text-gray-600">
                    {orderDetails?.shippingAddress?.city}, {orderDetails?.shippingAddress?.state} {orderDetails?.shippingAddress?.zipCode}
                  </Text>
                  <Text className="text-gray-600">
                    {orderDetails?.shippingAddress?.country}
                  </Text>
                  {orderDetails?.estimatedDelivery && (
                    <Text className="text-gray-600 mt-2">
                      Estimated Delivery: {orderDetails.estimatedDelivery}
                    </Text>
                  )}
                </Section>
              )}

              <Section className="mt-6">
                <Text className="text-gray-600">
                  If you have any questions about your order, please don&apos;t hesitate to contact our support team.
                </Text>
              </Section>

              <Text className="text-lg mt-6">
                Best regards, <br /> The OLOVARA Team
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