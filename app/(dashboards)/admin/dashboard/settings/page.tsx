import AdminSettingsForm from "@/components/admin/AdminSettingsForm";

export const metadata = {
    title: "Admin - Settings",
  };
  
  export default function AdminSettings() {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <AdminSettingsForm />
      </div>
    );
  }