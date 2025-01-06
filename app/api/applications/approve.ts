import { prisma } from "@/lib/prisma"; // Replace with your Prisma instance path

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method not allowed");
  }

  const { applicationId } = req.body;

  try {
    await prisma.sellerApplication.update({
      where: { id: applicationId },
      data: { applicationApproved: true },
    });

    return res.status(200).json({ message: "Application approved!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}