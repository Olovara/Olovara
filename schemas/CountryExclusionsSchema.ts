import * as z from "zod";
import { getShippableCountries } from "@/data/un-countries";

// Get shippable country codes (all UN countries except sanctioned ones)
const SHIPPABLE_COUNTRY_CODES = getShippableCountries().map(country => country.code);

export const CountryExclusionsSchema = z.object({
  excludedCountries: z.array(
    z.string().refine((code) => SHIPPABLE_COUNTRY_CODES.includes(code), {
      message: "Invalid country code",
    })
  ).default([]),
});

export type CountryExclusionsFormData = z.infer<typeof CountryExclusionsSchema>; 