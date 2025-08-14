import { auth } from "@/auth";
import { db } from "@/lib/db";
import { decryptData } from "@/lib/encryption";
import ProfileForm from "@/components/forms/ProfileForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Member - Settings",
};

export default async function MemberSettings() {
  const session = await auth();
  if (!session?.user?.id) {
    return <div>Not authenticated</div>;
  }

  // Get user profile data from the unified User model
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      encryptedFirstName: true,
      firstNameIV: true,
      firstNameSalt: true,
      userBio: true,
    },
  });

  // Decrypt first name if it exists
  let firstName = null;
  if (user?.encryptedFirstName && user?.firstNameIV && user?.firstNameSalt) {
    try {
      firstName = decryptData(
        user.encryptedFirstName,
        user.firstNameIV,
        user.firstNameSalt
      );
    } catch (error) {
      console.error("Error decrypting first name:", error);
      firstName = null;
    }
  }

  const profileData = {
    firstName: firstName || "",
    bio: user?.userBio || "",
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile Settings</h3>
        <p className="text-sm text-muted-foreground">
          Update your profile information and settings.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm initialData={profileData} />
        </CardContent>
      </Card>
    </div>
  );
}
