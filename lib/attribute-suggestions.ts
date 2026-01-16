import Fuse from "fuse.js";
import {
  ATTRIBUTE_DICTIONARY,
  AttributeDictionary,
  normalizeAttributeValue,
} from "@/data/attribute-dictionary";

// Interface for attribute suggestions
export interface AttributeSuggestions {
  material?: string[];
  size?: string[];
  color?: string[];
  technique?: string[];
  room?: string[];
  recipient?: string[];
  occasion?: string[];
  style?: string[];
  scent?: string[];
  weight?: string[];
  theme?: string[];
  aesthetic?: string[];
  useCase?: string[];
}

/**
 * Generate attribute suggestions based on product name and description
 * Uses Fuse.js for fuzzy matching against the attribute dictionary
 * Similar to category suggestions - searches both full text and individual words
 * Uses stricter thresholds and score filtering to reduce false positives
 *
 * @param productName - Product name to analyze
 * @param description - Product description (can be HTML, will be stripped)
 * @param primaryCategory - Primary category ID (optional, currently unused)
 * @param secondaryCategory - Secondary category ID (optional, currently unused)
 * @returns Object with suggested attributes grouped by type
 */
export function suggestAttributes(
  productName: string,
  description: string | { html?: string; text?: string } | null | undefined,
  primaryCategory?: string,
  secondaryCategory?: string
): AttributeSuggestions {
  // Extract text from description if it's an object
  let descriptionText = "";
  if (description) {
    if (typeof description === "string") {
      descriptionText = description;
    } else if (typeof description === "object" && description !== null) {
      // Prefer text field, fallback to HTML stripped of tags
      if (description.text) {
        descriptionText = description.text;
      } else if (description.html) {
        // Strip HTML tags for text extraction
        descriptionText = description.html.replace(/<[^>]*>/g, " ");
      }
    }
  }

  // Combine searchable text (name + description)
  const searchableText = `${productName} ${descriptionText}`.toLowerCase().trim();

  // Return empty if searchable text is too short
  if (searchableText.length < 2) {
    return {};
  }

  // Initialize suggestions object
  const suggestions: AttributeSuggestions = {};

  // Define stricter thresholds per attribute type to reduce false positives
  // Lower threshold = stricter matching (0.0 = exact, 0.6 = very lenient)
  const attributeThresholds: Partial<Record<keyof AttributeDictionary, number>> = {
    material: 0.3, // Stricter - materials are specific
    technique: 0.3, // Stricter - techniques are specific
    color: 0.35, // Slightly lenient for color variations
    size: 0.3, // Stricter - sizes are specific
    recipient: 0.3, // Stricter - recipients are specific
    occasion: 0.35, // Slightly lenient for occasion variations
    room: 0.4, // More lenient - room names can vary
    style: 0.4, // More lenient - style terms can vary
    scent: 0.25, // Very strict - only match if scent is explicitly mentioned
    weight: 0.3, // Stricter - weight terms are specific
    theme: 0.4, // More lenient - theme terms can vary
    aesthetic: 0.4, // More lenient - aesthetic terms can vary
    useCase: 0.35, // Slightly lenient
  };

  // Maximum score threshold - filter out weak matches
  // Scores closer to 0 are better matches, scores closer to 1 are worse
  const MAX_SCORE_THRESHOLD = 0.5; // Only accept matches with score < 0.5 (good matches)

  // For each attribute group in the dictionary, run fuzzy matching
  for (const [attributeType, values] of Object.entries(
    ATTRIBUTE_DICTIONARY
  ) as [keyof AttributeDictionary, string[]][]) {
    // Get threshold for this attribute type, default to 0.35
    const threshold = attributeThresholds[attributeType] ?? 0.35;

    // Create Fuse instance for this attribute type with stricter config
    const fuse = new Fuse(values, {
      threshold, // Stricter threshold per attribute type
      includeScore: true, // Include match scores for sorting
      minMatchCharLength: 3, // Minimum 3 characters to match (reduced from 2)
      findAllMatches: true, // Find matches across all words
      ignoreLocation: true, // Don't penalize matches based on position
      shouldSort: true, // Sort results by score
    });

    // Search with the full combined text
    const fullResults = fuse.search(searchableText, { limit: 15 });

    // Also search individual words to catch cases like "wool blanket" -> "wool"
    const words = searchableText
      .split(/\s+/)
      .filter((w) => w.length >= 3); // Only search words with 3+ characters
    const wordResults: typeof fullResults = [];

    if (words.length > 0) {
      // Search each word individually and combine results
      for (const word of words) {
        const wordSearch = fuse.search(word, { limit: 3 }); // Reduced from 5
        wordResults.push(...wordSearch);
      }
    }

    // Combine and deduplicate results, prioritizing full matches
    const allResults = [...fullResults, ...wordResults];

    // First, check for exact word matches in the text (highest priority)
    // This catches cases like "ocean" in "Ocean animal lovers"
    // Strip punctuation from words and normalize for better matching
    const searchWords = searchableText
      .split(/\s+/)
      .map(w => normalizeAttributeValue(w.replace(/[^\w\s]/g, ''))); // Remove punctuation
    
    // Also create a regex pattern to find whole word matches (handles punctuation)
    const exactMatches: Array<{ item: string; score: number }> = [];
    
    for (const value of values) {
      const normalizedValue = normalizeAttributeValue(value);
      
      // Method 1: Check if it appears as a word in the split array (after removing punctuation)
      if (searchWords.includes(normalizedValue)) {
        exactMatches.push({ item: value, score: 0 }); // Perfect match = score 0
        continue;
      }
      
      // Method 2: Use word boundary regex to find exact word matches in the full text
      // This handles cases where punctuation might be attached to the word
      // Escape special regex characters in the value
      const escapedValue = normalizedValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const wordBoundaryRegex = new RegExp(`\\b${escapedValue}\\b`, 'i');
      if (wordBoundaryRegex.test(searchableText)) {
        exactMatches.push({ item: value, score: 0 }); // Perfect match = score 0
      }
    }

    // Sort by score (lower is better) and remove duplicates
    const uniqueResults = new Map<string, { item: string; score: number }>();
    
    // Add exact matches first (highest priority)
    for (const exactMatch of exactMatches) {
      uniqueResults.set(exactMatch.item, exactMatch);
    }

    // Then process Fuse results
    for (const result of allResults) {
      const key = result.item;
      const score = result.score ?? 1;
      const normalizedKey = normalizeAttributeValue(key);

      // Skip if we already have this as an exact match
      if (uniqueResults.has(key) && uniqueResults.get(key)?.score === 0) {
        continue;
      }

      // Check if the attribute appears as a whole word in the text
      // Use both the word list and regex for comprehensive matching
      const escapedKey = normalizedKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const hasExactWordMatch = searchWords.includes(normalizedKey) || 
        new RegExp(`\\b${escapedKey}\\b`, 'i').test(searchableText);

      // For very strict attribute types, require exact word match or very good score
      const strictTypes: (keyof AttributeDictionary)[] = ['scent', 'weight', 'technique'];
      if (strictTypes.includes(attributeType)) {
        // For strict types, only accept if exact word match OR very good score (< 0.2)
        if (!hasExactWordMatch && score >= 0.2) {
          continue;
        }
      }

      // Filter out weak matches - only keep good matches (unless it's an exact word match)
      if (!hasExactWordMatch && score > MAX_SCORE_THRESHOLD) {
        continue;
      }

      // Check if we already have this result
      const existingResult = uniqueResults.get(key);

      // Prioritize exact word matches and better scores
      if (!existingResult) {
        // New result, add it
        uniqueResults.set(key, { item: key, score });
      } else {
        const existingScore = existingResult.score;
        const existingHasExact = existingScore === 0; // Exact matches have score 0

        // Replace if: current has exact match and existing doesn't, OR current has better score
        if (
          (hasExactWordMatch && !existingHasExact) ||
          (!hasExactWordMatch && !existingHasExact && score < existingScore)
        ) {
          uniqueResults.set(key, { item: key, score });
        }
      }
    }

    // Sort by score (exact matches first with score 0, then by Fuse score) and take top results
    const sortedResults = Array.from(uniqueResults.values())
      .sort((a, b) => {
        // Exact matches (score 0) always come first
        if (a.score === 0 && b.score !== 0) return -1;
        if (b.score === 0 && a.score !== 0) return 1;
        // Then sort by score
        return a.score - b.score;
      })
      .slice(0, 5); // Limit to top 5 suggestions per attribute type

    // Get unique matched values (normalized)
    if (sortedResults.length > 0) {
      const matchedValues = sortedResults
        .map((match) => normalizeAttributeValue(match.item))
        .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

      if (matchedValues.length > 0) {
        suggestions[attributeType] = matchedValues;
      }
    }
  }

  return suggestions;
}

/**
 * Merge existing attributes with new suggestions
 * Prevents duplicates and preserves existing values
 *
 * @param existing - Current attributes on the product
 * @param suggestions - New suggestions to merge
 * @returns Merged attributes object
 */
export function mergeAttributeSuggestions(
  existing: AttributeSuggestions | null | undefined,
  suggestions: AttributeSuggestions
): AttributeSuggestions {
  const merged: AttributeSuggestions = { ...existing };

  // For each attribute type in suggestions
  for (const [type, suggestedValues] of Object.entries(suggestions)) {
    if (!suggestedValues || suggestedValues.length === 0) continue;

    const attributeType = type as keyof AttributeSuggestions;
    const existingValues = merged[attributeType] || [];

    // Normalize all values for comparison
    const normalizedExisting: string[] = existingValues.map(
      normalizeAttributeValue
    );
    const normalizedSuggested: string[] = suggestedValues.map(
      normalizeAttributeValue
    );

    // Add suggestions that don't already exist
    const newValues = normalizedSuggested.filter(
      (value: string) => !normalizedExisting.includes(value)
    );

    if (newValues.length > 0) {
      merged[attributeType] = [...existingValues, ...newValues];
    } else if (existingValues.length === 0) {
      // If no existing values, add all suggestions
      merged[attributeType] = suggestedValues;
    }
  }

  return merged;
}
