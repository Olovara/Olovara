import { NextResponse } from "next/server";
import { SUPPORTED_CURRENCIES } from "@/data/units";
import {
  batchConvertCurrencyAmounts,
  convertCurrencyAmount,
} from "@/lib/currency-convert";
import { logError } from "@/lib/error-logger";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: any = null;

  try {
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400 },
      );
    }

    const text = await req.text();
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Request body is empty" }, { status: 400 });
    }

    try {
      body = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const supportedCurrencies = SUPPORTED_CURRENCIES.map((c) =>
      c.code.toLowerCase(),
    );

    if (Array.isArray(body.conversions)) {
      const { conversions } = body;
      if (!conversions || conversions.length === 0) {
        return NextResponse.json(
          { error: "Missing or empty conversions array" },
          { status: 400 },
        );
      }

      for (const conv of conversions) {
        if (!conv.amount || !conv.fromCurrency || !conv.toCurrency) {
          return NextResponse.json(
            { error: "Missing required parameters in conversion" },
            { status: 400 },
          );
        }
        if (
          !supportedCurrencies.includes(conv.fromCurrency.toLowerCase()) ||
          !supportedCurrencies.includes(conv.toCurrency.toLowerCase())
        ) {
          return NextResponse.json(
            {
              error: `Unsupported currency in conversion: ${conv.fromCurrency} -> ${conv.toCurrency}`,
            },
            { status: 400 },
          );
        }
      }

      const convertedAmounts = await batchConvertCurrencyAmounts(conversions);
      return NextResponse.json({ convertedAmounts });
    }

    const { amount, fromCurrency, toCurrency, isCents } = body;
    if (!amount || !fromCurrency || !toCurrency) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }
    if (
      !supportedCurrencies.includes(fromCurrency.toLowerCase()) ||
      !supportedCurrencies.includes(toCurrency.toLowerCase())
    ) {
      return NextResponse.json({ error: "Unsupported currency" }, { status: 400 });
    }

    const convertedAmount = await convertCurrencyAmount(
      amount,
      fromCurrency,
      toCurrency,
      isCents,
    );
    return NextResponse.json({ convertedAmount });
  } catch (error) {
    console.error("Error in currency conversion API:", error);
    const userMessage = logError({
      code: "CURRENCY_CONVERT_FAILED",
      userId: undefined,
      route: "/api/currency/convert",
      method: "POST",
      error,
      metadata: {
        isBatch: Array.isArray(body?.conversions),
        note: "Failed to convert currency",
      },
    });
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
