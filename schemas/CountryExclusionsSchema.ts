import * as z from "zod";
import { getOnboardingCountries } from "@/data/countries";

// Get supported country codes
const SUPPORTED_COUNTRY_CODES = getOnboardingCountries().map(country => country.code);

export const CountryExclusionsSchema = z.object({
  excludedCountries: z.array(
    z.enum(SUPPORTED_COUNTRY_CODES as [string, ...string[]], {
      required_error: "Please select valid countries",
    })
  ).default([]),
});

export type CountryExclusionsFormData = z.infer<typeof CountryExclusionsSchema>; 