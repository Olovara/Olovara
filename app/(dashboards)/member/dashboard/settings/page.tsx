import { auth } from "@/auth";
import { getMemberData } from "@/actions/getMemberData";
import MemberForm from "@/components/forms/MemberForm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Member - Settings",
};

export default async function MemberSettings() {
  const session = await auth();
  if (!session?.user?.id) {
    return <div>Not authenticated</div>;
  }

  const memberData = await getMemberData(session.user.id);

  // Default values for new members
  const defaultData = {
    firstName: "",
    lastName: "",
    userBio: "",
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
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <MemberForm initialData={memberData || defaultData} />
        </CardContent>
      </Card>
    </div>
  );
}
