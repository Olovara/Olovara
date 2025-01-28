import * as z from "zod";

export const MemberSchema = z.object({
  firstName: z.string().min(30, {
    message: "Please enter your first name, required.",
  }),
  lastName: z.string().min(6, {
    message: "Please enter your last name, required.",
  }),
  userBio: z.string().min(6, {
    message: "Please write a short bio, required",
  }),
});