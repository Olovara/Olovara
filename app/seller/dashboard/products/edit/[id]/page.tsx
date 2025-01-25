import { ProductForm } from "@/components/forms/ProductForm";

export const metadata = {
  title: "Seller - Edit Product",
};

export default function EditProduct() {
  return (
    <div className="flex items-center justify-center vertical-center">
      <ProductForm />
    </div>
  );
}