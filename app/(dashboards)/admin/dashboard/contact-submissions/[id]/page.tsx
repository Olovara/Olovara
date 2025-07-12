import { getContactSubmissionById } from "@/actions/adminActions";
import { notFound } from "next/navigation";
import { ContactSubmissionDetail } from "@/components/admin/ContactSubmissionDetail";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Admin - Contact Submission Details",
};

export default async function ContactSubmissionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const submission = await getContactSubmissionById(params.id);

  if (!submission) {
    notFound();
  }

  return <ContactSubmissionDetail submission={submission} />;
} 