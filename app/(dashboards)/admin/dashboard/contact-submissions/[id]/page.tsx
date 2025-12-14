import { getContactSubmissionById } from "@/actions/adminActions";
import { notFound, redirect } from "next/navigation";
import { ContactSubmissionDetail } from "@/components/admin/ContactSubmissionDetail";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Admin - Contact Submission Details",
};

export default async function ContactSubmissionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Check authentication first
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const submission = await getContactSubmissionById(params.id);

  if (!submission) {
    notFound();
  }

  return <ContactSubmissionDetail submission={submission} />;
} 