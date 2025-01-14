import { auth } from "@/auth";
import { getSession } from "next-auth/react";

export const currentUser = async () => {
  const session = await auth();

  return session?.user;
};

// A utility function to get the current role of the user
export const currentRole = async () => {
  try {
    const session = await getSession(); // Retrieve the session

    if (!session) {
      throw new Error("No session found"); // You can throw an error if there's no session
    }

    return session.user?.role; // Return the user's role from the session if it exists
  } catch (error) {
    console.error("Error fetching current role:", error); // Log error for debugging
    return null; // You can also return `null` or `undefined` here to handle the error gracefully
  }
};