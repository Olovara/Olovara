"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { setPaymentAmounts } from "@/actions/customOrderPaymentActions";
import { Loader2, Calculator } from "lucide-react";

const SetPaymentAmountsSchema = z.object({
  materialsDepositAmount: z.number().min(0.01, "Materials deposit must be at least $0.01"),
  finalPaymentAmount: z.number().min(0.01, "Final payment must be at least $0.01"),
  shippingCost: z.number().min(0, "Shipping cost cannot be negative").optional(),
});

type FormData = z.infer<typeof SetPaymentAmountsSchema>;

interface SetPaymentAmountsFormProps {
  submissionId: string;
  currency: string;
  onSuccess?: () => void;
}

export default function SetPaymentAmountsForm({
  submissionId,
  currency,
  onSuccess,
}: SetPaymentAmountsFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(SetPaymentAmountsSchema),
    defaultValues: {
      materialsDepositAmount: 0,
      finalPaymentAmount: 0,
      shippingCost: 0,
    },
  });

  const materialsDeposit = form.watch("materialsDepositAmount");
  const finalPayment = form.watch("finalPaymentAmount");
  const shippingCost = form.watch("shippingCost") || 0;
  const totalAmount = materialsDeposit + finalPayment + shippingCost;

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const result = await setPaymentAmounts({
        submissionId,
        materialsDepositAmount: data.materialsDepositAmount,
        finalPaymentAmount: data.finalPaymentAmount,
        totalAmount: data.materialsDepositAmount + data.finalPaymentAmount + (data.shippingCost || 0),
        currency,
        shippingCost: data.shippingCost,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Payment amounts set successfully!");
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error setting payment amounts:", error);
      toast.error("Failed to set payment amounts");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Set Payment Amounts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="materialsDepositAmount">
                Materials Deposit *
              </Label>
              <Input
                id="materialsDepositAmount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                {...form.register("materialsDepositAmount", { valueAsNumber: true })}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Non-refundable deposit to cover materials
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="finalPaymentAmount">
                Final Payment *
              </Label>
              <Input
                id="finalPaymentAmount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                {...form.register("finalPaymentAmount", { valueAsNumber: true })}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Remaining balance for labor and profit
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shippingCost">
              Shipping Cost
            </Label>
            <Input
              id="shippingCost"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...form.register("shippingCost", { valueAsNumber: true })}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Shipping cost (optional, can be added to final payment)
            </p>
          </div>

          {/* Total Summary */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-medium">Payment Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Materials Deposit:</span>
                <span>{formatCurrency(materialsDeposit)}</span>
              </div>
              <div className="flex justify-between">
                <span>Final Payment:</span>
                <span>{formatCurrency(finalPayment)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>{formatCurrency(shippingCost)}</span>
              </div>
              <div className="border-t pt-1 flex justify-between font-medium">
                <span>Total:</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || totalAmount <= 0}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting Amounts...
              </>
            ) : (
              "Set Payment Amounts"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 