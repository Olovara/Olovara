"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { ContactUsSchema } from "@/schemas/ContactUsSchema";
import { verifyRecaptcha, validateHoneypot } from "@/lib/recaptcha";

export const contactUs = async (values: z.infer<typeof ContactUsSchema>) => {
  const startTime = Date.now();
  const logContext = {
    timestamp: new Date().toISOString(),
    formData: {
      hasName: !!values.name,
      hasEmail: !!values.email,
      hasReason: !!values.reason,
      hasDescription: !!values.helpDescription,
      nameLength: values.name?.length || 0,
      emailLength: values.email?.length || 0,
      descriptionLength: values.helpDescription?.length || 0,
      reason: values.reason || 'not provided',
    },
  };

  try {
    // Step 1: Validate form fields with Zod
    const validatedFields = ContactUsSchema.safeParse(values);

    if (!validatedFields.success) {
      const validationErrors = validatedFields.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));

      const errorDetails = {
        ...logContext,
        error: "Validation failed",
        errorType: "ZodValidationError",
        validationErrors,
        status: 'FAILED',
        totalDurationMs: Date.now() - startTime,
      };

      console.error(`[CONTACT_US] Form validation failed`, errorDetails);
      
      // Return user-friendly error message with first validation error
      const firstError = validationErrors[0];
      let errorMessage = "Please check your form entries.";
      
      if (firstError) {
        // Provide specific error messages based on field
        if (firstError.field === 'name') {
          errorMessage = "Name must be at least 3 characters long.";
        } else if (firstError.field === 'email') {
          errorMessage = "Please enter a valid email address.";
        } else if (firstError.field === 'helpDescription') {
          errorMessage = "Please provide a description (at least 6 characters).";
        } else if (firstError.field === 'reason') {
          errorMessage = "Please select a reason for contacting us.";
        } else if (firstError.field === 'website') {
          errorMessage = "Invalid submission detected.";
        }
      }

      return { error: errorMessage, retryable: false };
    }

    const { name, email, reason, helpDescription, website, recaptchaToken } = validatedFields.data;

    // Step 2: Validate honeypot first (server-side double-check)
    if (!validateHoneypot(website)) {
      const errorDetails = {
        ...logContext,
        error: "Bot detected via honeypot field",
        errorType: "HoneypotValidationError",
        honeypotValue: website ? "filled" : "empty",
        status: 'FAILED',
        totalDurationMs: Date.now() - startTime,
      };

      console.warn(`[CONTACT_US] Bot detected via honeypot field`, errorDetails);
      return { error: "Invalid submission.", retryable: false };
    }

    // Step 3: Verify reCAPTCHA token
    if (!recaptchaToken) {
      const errorDetails = {
        ...logContext,
        error: "Missing reCAPTCHA token",
        errorType: "RecaptchaTokenMissing",
        status: 'FAILED',
        totalDurationMs: Date.now() - startTime,
      };

      console.error(`[CONTACT_US] Missing reCAPTCHA token`, errorDetails);
      return { error: "Security verification failed. Please try again.", retryable: true };
    }

    const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'contact_form', 0.5);
    if (!recaptchaResult.success) {
      const errorDetails = {
        ...logContext,
        error: "reCAPTCHA verification failed",
        errorType: "RecaptchaVerificationError",
        recaptchaError: recaptchaResult.error,
        recaptchaScore: recaptchaResult.score,
        recaptchaAction: recaptchaResult.action,
        status: 'FAILED',
        totalDurationMs: Date.now() - startTime,
      };

      console.error(`[CONTACT_US] reCAPTCHA verification failed`, errorDetails);
      return { error: "Security verification failed. Please try again.", retryable: true };
    }

    // Step 4: Save to database with retry logic for transient errors
    const maxRetries = 3;
    let lastError: Error | unknown = null;
    let retryCount = 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await db.contactUs.create({
          data: {
            name,
            email,
            reason,
            helpDescription,
          },
        });

        const totalDuration = Date.now() - startTime;
        console.log(`[CONTACT_US] Form submitted successfully`, {
          ...logContext,
          totalDurationMs: totalDuration,
          retryCount: attempt,
          status: 'SUCCESS',
        });

        return { success: "Successfully submitted your request." };
      } catch (dbError) {
        lastError = dbError;
        retryCount = attempt;

        const errorDetails = {
          ...logContext,
          error: dbError instanceof Error ? dbError.message : String(dbError),
          errorType: dbError instanceof Error ? dbError.constructor.name : typeof dbError,
          stack: dbError instanceof Error ? dbError.stack : undefined,
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          status: attempt < maxRetries ? 'RETRYING' : 'FAILED',
          totalDurationMs: Date.now() - startTime,
        };

        // Check if this is a retryable error
        const isRetryable = dbError instanceof Error && (
          dbError.message.includes('connect') ||
          dbError.message.includes('timeout') ||
          dbError.message.includes('ECONNREFUSED') ||
          dbError.message.includes('ETIMEDOUT') ||
          dbError.message.includes('ENOTFOUND') ||
          dbError.message.includes('P1001') || // Prisma connection error
          dbError.message.includes('P1008') || // Prisma operation timeout
          dbError.message.includes('P1017')   // Prisma server closed connection
        );

        // If not retryable or we've exhausted retries, break
        if (!isRetryable || attempt >= maxRetries) {
          break;
        }

        // Exponential backoff: wait 200ms, 400ms, 800ms
        const delayMs = Math.min(200 * Math.pow(2, attempt), 1000);
        console.warn(`[CONTACT_US] Database error, retrying in ${delayMs}ms...`, errorDetails);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    // If we get here, all retries failed
    const errorDetails = {
      ...logContext,
      error: lastError instanceof Error ? lastError.message : String(lastError),
      errorType: lastError instanceof Error ? lastError.constructor.name : typeof lastError,
      stack: lastError instanceof Error ? lastError.stack : undefined,
      retryCount,
      status: 'FAILED',
      totalDurationMs: Date.now() - startTime,
    };

    console.error(`[CONTACT_US] Database error after ${retryCount + 1} attempts`, errorDetails);
    
    // Check for specific database errors
    if (lastError instanceof Error) {
      if (lastError.message.includes('Unique constraint')) {
        return { 
          error: "A submission with this information already exists. Please wait a moment before trying again.",
          retryable: false 
        };
      }
      if (lastError.message.includes('connect') || lastError.message.includes('timeout')) {
        return { 
          error: "Database connection issue. Please try again.",
          retryable: true 
        };
      }
    }

    return { 
      error: "Failed to submit your request after multiple attempts. Please try again.",
      retryable: true 
    };
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    const errorDetails = {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      status: 'FAILED',
      totalDurationMs: totalDuration,
    };

    console.error(`[CONTACT_US] Unexpected error in contact form submission`, errorDetails);
    return { 
      error: "An unexpected error occurred. Please try again or contact support if the issue persists.",
      retryable: true 
    };
  }
};