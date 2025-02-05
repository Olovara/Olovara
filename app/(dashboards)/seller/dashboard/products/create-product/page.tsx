import { ProductForm } from "@/components/forms/ProductForm";

export const metadata = {
  title: "Seller - Create Product",
};

export default function CreateProduct() {
  return (
    <div className="flex items-center justify-center vertical-center">
      <ProductForm />
    </div>
  );
}