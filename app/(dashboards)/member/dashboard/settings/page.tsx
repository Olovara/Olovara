import MemberForm from "@/components/forms/MemberForm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { unstable_noStore as noStore } from "next/cache";
import { getMemberData } from "@/actions/getMemberData";

export const metadata = {
  title: "Member - Settings",
};

export default async function MemberSettings() {
  noStore();
  
  // Fetch member data
  const memberData = await getMemberData();
  
  // Provide default values if member data is not available
  const initialData = {
    firstName: memberData.data?.firstName || "",
    lastName: memberData.data?.lastName || "",
    userBio: memberData.data?.userBio || "",
    email: memberData.data?.email || "",
    image: memberData.data?.image || "",
  };

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          {/*<TabsTrigger value="preferences">Preferences</TabsTrigger>  TODO add later*/}
        </TabsList>
        <div className="flex-1 pt-2">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Personal Settings */}
              <TabsContent value="personal">
                <MemberForm initialData={initialData} />
              </TabsContent>

              {/* Preferences Settings */}
              <TabsContent value="preferences">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Preferences</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage your notification settings and preferences.
                  </p>
                  {/* Add notification preferences form here */}
                </div>
              </TabsContent>
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </main>
  );
}
