import ProfileForm from "@/components/forms/ProfileForm";

export default function ProfilePage() {
  return (
    <div className="w-full px-4 sm:px-6 md:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your personal information and bio
          </p>
        </div>
        
        <ProfileForm />
      </div>
    </div>
  );
} 