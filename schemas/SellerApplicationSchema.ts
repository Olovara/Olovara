import * as z from "zod";

// Helper function to calculate age from birthdate
const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  // Debug logging
  console.log('Age calculation:', {
    birthDate: birthDate.toISOString(),
    today: today.toISOString(),
    calculatedAge: age,
    monthDiff,
    dayDiff: today.getDate() - birthDate.getDate()
  });
  
  return age;
};

// Helper function to validate referral code format
const isValidReferralCodeFormat = (code: string): boolean => {
  const pattern = /^OLOVARA-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(code);
};

export const SellerApplicationSchema = z.object({
  // Core crafting information (required)
  craftingProcess: z.string().min(30, {
    message: "Please provide a detailed description of your crafting process (at least 30 characters).",
  }),
  productTypes: z.string().min(10, { 
    message: "Please describe the types of products you make (at least 10 characters)." 
  }),
  interestInJoining: z.string().min(6, {
    message: "Please provide a more detailed explanation of your interest in joining OLOVARA (at least 6 characters).",
  }),
  
  // Optional online presence (single field)
  onlinePresence: z.string().optional(),
  
  // Optional experience
  yearsOfExperience: z.string().optional(),
  
  // Optional referral code
  referralCode: z.string().optional().refine((code) => {
    if (!code) return true; // Empty is valid (optional field)
    return isValidReferralCodeFormat(code);
  }, { 
    message: "Please enter a valid referral code in the format OLOVARA-XXXX-XXXX" 
  }),
  
  // Age verification (required for legal protection)
  birthdate: z.string().refine((date) => {
    try {
      const birthDate = new Date(date);
      
      // Check if the date is valid
      if (isNaN(birthDate.getTime())) {
        console.error('Invalid date format:', date);
        return false;
      }
      
      const age = calculateAge(birthDate);
      console.log('Birthdate validation:', { inputDate: date, parsedDate: birthDate.toISOString(), calculatedAge: age });
      
      return age >= 18;
    } catch (error) {
      console.error('Error calculating age:', error);
      return false;
    }
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