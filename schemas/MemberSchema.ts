import * as z from "zod";

export const MemberSchema = z.object({
  firstName: z.string().min(1, {
    message: "Please enter your first name, required.",
  }),
  lastName: z.string().min(1, {
    message: "Please enter your last name, required.",
  }),
  userBio: z.string().min(1, {
    message: "Please write a short bio, required",
  }),
  image: z.string().optional(),
});

// Schema for the encrypted data that will be stored in the database
export const EncryptedMemberSchema = z.object({
  encryptedFirstName: z.string(),
  encryptedLastName: z.string(),
  firstNameIV: z.string(),
  lastNameIV: z.string(),
  userBio: z.string(),
  image: z.string().optional(),
});