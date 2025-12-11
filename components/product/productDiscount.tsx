import * as React from "react";
import { useFormContext } from "react-hook-form";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type DiscountSectionProps = {
  form: any;
};

export function ProductDiscountSection({ form }: DiscountSectionProps) {
  const { control, watch, register, setValue } = form;
  const discountEndDate = watch("discountEndDate");
  const [date, setDate] = React.useState<Date | undefined>(
    discountEndDate instanceof Date ? discountEndDate : undefined
  );

  // Watch the onSale state
  const onSale = watch("onSale");

  // Sync local date state with form value
  React.useEffect(() => {
    if (discountEndDate instanceof Date) {
      setDate(discountEndDate);
    } else if (typeof discountEndDate === "string" && discountEndDate) {
      const parsedDate = new Date(discountEndDate);
      if (!isNaN(parsedDate.getTime())) {
        setDate(parsedDate);
      }
    } else {
      setDate(undefined);
    }
  }, [discountEndDate]);

  React.useEffect(() => {
    // Reset discount end date and time when the sale status changes
    if (!onSale) {
      setValue("discountEndDate", undefined);
      setValue("discountEndTime", "");
      setDate(undefined);
    }
  }, [onSale, setValue]);

  return (
    <div className="space-y-6">
      {/* Checkbox to toggle onSale */}
      <FormField
        control={control}
        name="onSale"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center space-x-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(value) => field.onChange(value)}
                />
              </FormControl>
              <FormLabel className="!mt-0">Is this product on sale?</FormLabel>
            </div>
          </FormItem>
        )}
      />

      {/* Conditional discount fields based on onSale */}
      {onSale && (
        <div className="space-y-4">
          {/* Discount Percent */}
          <div className="flex flex-col gap-y-2">
            <Label>Discount Percent</Label>
            <Input
              type="number"
              placeholder="Discount percent"
              {...register("discount", { valueAsNumber: true })}
            />
          </div>

          {/* Discount End Date */}
          <div className="flex flex-col gap-y-2">
            <Label>Discount End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(selectedDate) => {
                    setDate(selectedDate);
                    if (selectedDate) {
                      setValue("discountEndDate", selectedDate);
                    } else {
                      // Clear the date if deselected
                      setValue("discountEndDate", undefined);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Discount End Time */}
          <div className="flex flex-col gap-y-2">
            <Label>Discount End Time</Label>
            <FormField
              control={control}
              name="discountEndTime"
              render={({ field }) => (
                <Input type="time" className="w-[280px]" {...field} />
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}
