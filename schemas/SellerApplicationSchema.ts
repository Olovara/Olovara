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
  craftingProcess: z.string().min(30, {
    message: "Please enter your crafting process, required.",
  }),
  portfolio: z.string().min(6, {
    message: "Please enter a link to your portfolio, required.",
  }),
  interestInJoining: z.string().min(6, {
    message: "Please enter the reason for your interest in joining, required",
  }),
  
  // New high-impact fields to deter scammers
  websiteOrShopLinks: z.string().min(6, { 
    message: "Please provide your website or shop links." 
  }),
  socialMediaProfiles: z.string().min(6, { 
    message: "Please provide your active social media profiles." 
  }),
  location: z.string().min(2, { 
    message: "Please provide your city/state or country." 
  }),
  yearsOfExperience: z.string().min(1, { 
    message: "Please specify your years of crafting experience." 
  }),
  productTypes: z.string().min(10, { 
    message: "Please describe the types of products you make." 
  }),
  
  // Age verification - using DOB for better legal protection
  birthdate: z.string().refine((date) => {
    const age = calculateAge(new Date(date));
    return age >= 18;
  }, { message: "You must be at least 18 years old to sell." }),
  
  // Policy agreements
  agreeToHandmadePolicy: z.boolean().refine((val) => val === true, { 
    message: "You must agree to the Handmade Policy." 
  }),
  certifyOver18: z.boolean().refine((val) => val === true, { 
    message: "You must certify you are 18 or older to sell." 
  }),
  
  // Legal disclaimer confirmation
  agreeToTerms: z.boolean().refine((val) => val === true, { 
    message: "You must agree to the terms and conditions." 
  }),
});