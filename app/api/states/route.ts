import { NextRequest, NextResponse } from 'next/server';
import { 
  getStatesByCountry, 
  getOnboardingCountriesStates, 
  getAllCountriesWithStates,
  hasStates,
  getStateByCode 
} from '@/data/states';

/**
 * GET /api/states
 * Returns states/provinces data for countries
 * 
 * Query parameters:
 * - country: Country code (optional) - if provided, returns states for that country only
 * - state: State code (optional) - if provided with country, returns specific state info
 * - all: Boolean (optional) - if true, returns all countries with their states
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get('country');
    const stateCode = searchParams.get('state');
    const all = searchParams.get('all') === 'true';

    // If 'all' parameter is provided, return all countries with states
    if (all) {
      const allCountriesStates = getOnboardingCountriesStates();
      return NextResponse.json({
        success: true,
        data: allCountriesStates,
        countries: getAllCountriesWithStates()
      });
    }

    // If country code is provided
    if (countryCode) {
      // Check if country has states
      if (!hasStates(countryCode)) {
        return NextResponse.json({
          success: false,
          error: 'Country does not have states/provinces data',
          countryCode
        }, { status: 404 });
      }

      // If state code is also provided, return specific state
      if (stateCode) {
        const state = getStateByCode(countryCode, stateCode);
        if (!state) {
          return NextResponse.json({
            success: false,
            error: 'State not found',
            countryCode,
            stateCode
          }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          data: state,
          countryCode,
          stateCode
        });
      }

      // Return all states for the country
      const states = getStatesByCountry(countryCode);
      return NextResponse.json({
        success: true,
        data: states,
        countryCode,
        count: states.length
      });
    }

    // Default: return list of countries that have states
    const countriesWithStates = getAllCountriesWithStates();
    return NextResponse.json({
      success: true,
      data: countriesWithStates,
      count: countriesWithStates.length,
      message: 'Use ?country=CODE to get states for a specific country, or ?all=true to get all countries with states'
    });

  } catch (error) {
    console.error('Error in states API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * POST /api/states/search
 * Search states/provinces across countries
 * 
 * Body: {
 *   query: string - search term
 *   countries?: string[] - optional array of country codes to search in
 *   limit?: number - optional limit for results
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, countries, limit = 50 } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Query parameter is required'
      }, { status: 400 });
    }

    const searchTerm = query.toLowerCase();
    const results: Array<{
      countryCode: string;
      countryName: string;
      state: {
        code: string;
        name: string;
        type: string;
      };
    }> = [];

    // Get countries to search in
    const countriesToSearch = countries || getAllCountriesWithStates();

    // Search in each country
    for (const countryCode of countriesToSearch) {
      if (!hasStates(countryCode)) continue;

      const states = getStatesByCountry(countryCode);
      const matchingStates = states.filter(state =>
        state.name.toLowerCase().includes(searchTerm) ||
        state.code.toLowerCase().includes(searchTerm)
      );

      // Add matching states to results
      for (const state of matchingStates) {
        results.push({
          countryCode,
          countryName: getOnboardingCountriesStates()[countryCode]?.countryName || countryCode,
          state: {
            code: state.code,
            name: state.name,
            type: state.type
          }
        });

        // Check limit
        if (results.length >= limit) break;
      }

      if (results.length >= limit) break;
    }

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
      query: searchTerm
    });

  } catch (error) {
    console.error('Error in states search API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
