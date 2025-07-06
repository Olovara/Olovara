import { getCustomOrderForm } from "@/actions/customOrderFormActions";
import CustomOrderFormBuilder from "@/components/seller/CustomOrderFormBuilder";
import { notFound } from "next/navigation";

interface EditFormPageProps {
  params: {
    id: string;
  };
}

export default async function EditFormPage({ params }: EditFormPageProps) {
  const result = await getCustomOrderForm(params.id);

  if (result.error || !result.data) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Custom Order Form</h1>
        <p className="text-muted-foreground">
          Update your form fields and settings. Existing submissions will be preserved.
        </p>
      </div>

      <CustomOrderFormBuilder 
        initialData={result.data}
        mode="edit"
      />
    </div>
  );
} 