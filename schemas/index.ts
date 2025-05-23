import * as z from "zod";
import { UserRole } from "@prisma/client";

interface UserData {
  password?: string;
  newPassword?: string;
  newPasswordConfirmation?: string;
}

const passwordRequired = (
  data: UserData,
  passwordField: keyof UserData,
  newPasswordField: keyof UserData,
  newPasswordConfirmationField: keyof UserData = "newPasswordConfirmation"
) => {
  const newPasswordEntered = data[newPasswordField] !== undefined;
  const confirmationEntered = data[newPasswordConfirmationField] !== undefined;

  if (newPasswordEntered && !confirmationEntered) {
    return false;
  }

  return !(
    (data[passwordField] && !data[newPasswordField]) ||
    (data[newPasswordField] && !data[passwordField])
  );
};

export const SettingsSchema = z
  .object({
    name: z.optional(z.string()),
    isTwoFactorEnabled: z.optional(z.boolean()),
    role: z.enum([UserRole.ADMIN, UserRole.MEMBER]),
    email: z.optional(z.string().email()),
    password: z.optional(z.string().min(1)),
    newPassword: z.optional(
      z.string().min(6, {
        message:
          "Please enter a new password with at least 6 characters, required",
      })
    ),
    newPasswordConfirmation: z.optional(
      z.string().min(6, {
        message:
          "Please confirm your password with at least 6 characters, required",
      })
    ),
  })
  .refine((data) => passwordRequired(data, "password", "newPassword"), {
    message:
      "Please enter a new password with at least 6 characters, required!",
    path: ["newPassword"],
  })
  .refine((data) => passwordRequired(data, "newPassword", "password"), {
    message: "Please enter your valid password, required!",
    path: ["password"],
  })
  .refine((data) => data.newPassword === data.newPasswordConfirmation, {
    message: "Passwords do not match.",
    path: ["newPasswordConfirmation"],
  });

export const NewPasswordSchema = z
  .object({
    password: z.string().min(6, {
      message: "Please enter your password, required",
    }),
    passwordConfirmation: z.string().min(6, {
      message: "Please confirm your password, required.",
    }),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match.",
    path: ["passwordConfirmation"],
  });

export const ResetSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address, required.",
  }),
});

export const LoginSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address. Email is required.",
  }),
  password: z.string().min(1, {
    message: "Please enter your password. Password is required.",
  }),
  code: z.optional(z.string()),
});

export const RegisterSchema = z
  .object({
    username: z
      .string()
      .min(3, {
        message: "Username must be at least 3 characters long.",
      })
      .max(30, {
        message: "Username must be less than 30 characters.",
      })
      .regex(/^[a-zA-Z0-9_-]+$/, {
        message: "Username can only contain letters, numbers, underscores, and hyphens.",
      }),
    email: z
      .string()
      .email({
        message: "Please enter a valid email address, required.",
      })
      .max(255, {
        message: "Email must be less than 255 characters.",
      }),
    password: z
      .string()
      .min(8, {
        message: "Password must be at least 8 characters long.",
      })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter.",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter.",
      })
      .regex(/[0-9]/, {
        message: "Password must contain at least one number.",
      })
      .regex(/[^A-Za-z0-9]/, {
        message: "Password must contain at least one special character.",
      }),
    passwordConfirmation: z.string(),
    // Honeypot field - should be empty
    website: z.string().max(0, {
      message: "This field should be empty.",
    }),
    // reCAPTCHA token
    recaptchaToken: z.string({
      required_error: "Please complete the reCAPTCHA verification.",
    }),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match.",
    path: ["passwordConfirmation"],
  });