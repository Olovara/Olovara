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