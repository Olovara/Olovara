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
  const saleStartDate = watch("saleStartDate");
  const saleEndDate = watch("saleEndDate");
  const [startDate, setStartDate] = React.useState<Date | undefined>(
    saleStartDate instanceof Date ? saleStartDate : undefined
  );
  const [endDate, setEndDate] = React.useState<Date | undefined>(
    saleEndDate instanceof Date ? saleEndDate : undefined
  );

  // Watch the onSale state
  const onSale = watch("onSale");

  // Sync local date state with form values
  React.useEffect(() => {
    if (saleStartDate instanceof Date) {
      setStartDate(saleStartDate);
    } else if (typeof saleStartDate === "string" && saleStartDate) {
      const parsedDate = new Date(saleStartDate);
      if (!isNaN(parsedDate.getTime())) {
        setStartDate(parsedDate);
      }
    } else {
      setStartDate(undefined);
    }
  }, [saleStartDate]);

  React.useEffect(() => {
    if (saleEndDate instanceof Date) {
      setEndDate(saleEndDate);
    } else if (typeof saleEndDate === "string" && saleEndDate) {
      const parsedDate = new Date(saleEndDate);
      if (!isNaN(parsedDate.getTime())) {
        setEndDate(parsedDate);
      }
    } else {
      setEndDate(undefined);
    }
  }, [saleEndDate]);

  React.useEffect(() => {
    // Reset sale dates and times when the sale status changes
    if (!onSale) {
      setValue("saleStartDate", undefined);
      setValue("saleEndDate", undefined);
      setValue("saleStartTime", "");
      setValue("saleEndTime", "");
      setStartDate(undefined);
      setEndDate(undefined);
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
            <Label>Discount Percent (0-100)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              placeholder="Discount percent"
              {...register("discount", {
                valueAsNumber: true,
                min: { value: 0, message: "Discount must be at least 0%" },
                max: { value: 100, message: "Discount cannot exceed 100%" },
              })}
            />
          </div>

          {/* Sale Start Date */}
          <div className="flex flex-col gap-y-2">
            <Label>Sale Start Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? (
                    format(startDate, "PPP")
                  ) : (
                    <span>Pick start date (optional)</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(selectedDate) => {
                    setStartDate(selectedDate);
                    if (selectedDate) {
                      setValue("saleStartDate", selectedDate);
                    } else {
                      setValue("saleStartDate", undefined);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Sale Start Time */}
          <div className="flex flex-col gap-y-2">
            <Label>Sale Start Time (Optional)</Label>
            <FormField
              control={control}
              name="saleStartTime"
              render={({ field }) => (
                <Input type="time" className="w-[280px]" {...field} />
              )}
            />
          </div>

          {/* Sale End Date */}
          <div className="flex flex-col gap-y-2">
            <Label>Sale End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? (
                    format(endDate, "PPP")
                  ) : (
                    <span>Pick end date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(selectedDate) => {
                    setEndDate(selectedDate);
                    if (selectedDate) {
                      setValue("saleEndDate", selectedDate);
                    } else {
                      setValue("saleEndDate", undefined);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Sale End Time */}
          <div className="flex flex-col gap-y-2">
            <Label>Sale End Time</Label>
            <FormField
              control={control}
              name="saleEndTime"
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
