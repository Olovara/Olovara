import * as z from "zod";

// Helper function to calculate age from birthdate
const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export const SellerApplicationSchema = z.object({
  // Core crafting information (required)
  craftingProcess: z.string().min(30, {
    message: "Please enter your crafting process, required.",
  }),
  productTypes: z.string().min(10, { 
    message: "Please describe the types of products you make." 
  }),
  interestInJoining: z.string().min(6, {
    message: "Please enter the reason for your interest in joining, required",
  }),
  
  // Optional online presence (single field)
  onlinePresence: z.string().optional(),
  
  // Optional experience
  yearsOfExperience: z.string().optional(),
  
  // Age verification (required for legal protection)
  birthdate: z.string().refine((date) => {
    const age = calculateAge(new Date(date));
    return age >= 18;
  }, { message: "You must be at least 18 years old to sell." }),
  
  // Policy agreements (required)
  agreeToHandmadePolicy: z.boolean().refine((val) => val === true, { 
    message: "You must agree to the Handmade Policy." 
  }),
  certifyOver18: z.boolean().refine((val) => val === true, { 
    message: "You must certify you are 18 or older to sell." 
  }),
  agreeToTerms: z.boolean().refine((val) => val === true, { 
    message: "You must agree to the terms and conditions." 
  }),
});