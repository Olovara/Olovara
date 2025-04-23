import { ErrorCard } from "@/components/auth/error-card";

export const metadata = {
  title: "Error",
  description: "Something went wrong!",
};

const ErrorPage = () => {
  return <ErrorCard />;
};

export default ErrorPage;