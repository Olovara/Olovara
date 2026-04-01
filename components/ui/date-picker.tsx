"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  disablePastDates?: boolean // New prop to disable past dates
  id?: string
  /** Use brand primary tokens for trigger, popover, and calendar (not theme accent / tertiary) */
  brandPrimary?: boolean
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Select date",
  disabled = false,
  className,
  disablePastDates = false, // Default to false to maintain backward compatibility
  id,
  brandPrimary = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [currentMonth, setCurrentMonth] = React.useState<Date>(date || new Date())

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const years = Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) => 1900 + i).reverse()

  const handleMonthChange = (monthIndex: string) => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(parseInt(monthIndex))
    setCurrentMonth(newDate)
  }

  const handleYearChange = (year: string) => {
    const newDate = new Date(currentMonth)
    newDate.setFullYear(parseInt(year))
    setCurrentMonth(newDate)
  }

  // Function to disable past dates if disablePastDates is true
  const disabledDays = disablePastDates ? { before: new Date() } : undefined

  const brandCalendarClassNames = brandPrimary
    ? {
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 border-brand-light-neutral-200 bg-brand-light-neutral-50 p-0 opacity-80 hover:bg-brand-primary-700 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-brand-primary-400 focus-visible:ring-offset-2"
        ),
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-brand-primary-100/40 [&:has([aria-selected])]:bg-brand-primary-100/60 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal text-brand-dark-neutral-900 aria-selected:opacity-100 hover:bg-brand-primary-100 hover:text-brand-dark-neutral-900"
        ),
        day_selected:
          "bg-brand-primary-700 text-white hover:bg-brand-primary-700 hover:text-white focus:bg-brand-primary-700 focus:text-white",
        day_today: "bg-brand-primary-200 text-brand-dark-neutral-900 font-medium",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-brand-primary-100/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_range_middle:
          "aria-selected:bg-brand-primary-100 aria-selected:text-brand-dark-neutral-900",
      }
    : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "w-full justify-between font-normal",
            brandPrimary &&
              "border-brand-light-neutral-200 bg-brand-light-neutral-50 text-brand-dark-neutral-900 shadow-none ring-offset-background hover:bg-brand-primary-50 hover:text-brand-dark-neutral-900 hover:border-brand-primary-300 focus-visible:border-brand-primary-400 focus-visible:ring-2 focus-visible:ring-brand-primary-400 focus-visible:ring-offset-2 [&>svg]:text-brand-dark-neutral-600",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          {date ? date.toLocaleDateString() : placeholder}
          <ChevronDownIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-auto p-4",
          brandPrimary &&
            "border-brand-light-neutral-200 bg-brand-light-neutral-50 font-jost"
        )}
        align="start"
      >
        <div className="space-y-4">
          {/* Month and Year Selectors */}
          <div className="flex gap-2 justify-center">
            <Select
              value={currentMonth.getMonth().toString()}
              onValueChange={handleMonthChange}
            >
              <SelectTrigger
                className={cn(
                  "w-[140px]",
                  brandPrimary &&
                    "border-brand-light-neutral-200 bg-brand-light-neutral-50 text-brand-dark-neutral-900 focus:ring-brand-primary-400 data-[state=open]:border-brand-primary-400"
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                className={cn(
                  brandPrimary &&
                    "border-brand-light-neutral-200 bg-brand-light-neutral-50 text-brand-dark-neutral-900"
                )}
              >
                {months.map((month, index) => (
                  <SelectItem
                    key={month}
                    value={index.toString()}
                    className={cn(
                      brandPrimary &&
                        "cursor-pointer focus:bg-brand-primary-50 focus:text-brand-dark-neutral-900"
                    )}
                  >
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={currentMonth.getFullYear().toString()}
              onValueChange={handleYearChange}
            >
              <SelectTrigger
                className={cn(
                  "w-[100px]",
                  brandPrimary &&
                    "border-brand-light-neutral-200 bg-brand-light-neutral-50 text-brand-dark-neutral-900 focus:ring-brand-primary-400 data-[state=open]:border-brand-primary-400"
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                className={cn(
                  brandPrimary &&
                    "border-brand-light-neutral-200 bg-brand-light-neutral-50 text-brand-dark-neutral-900"
                )}
              >
                {years.map((year) => (
                  <SelectItem
                    key={year}
                    value={year.toString()}
                    className={cn(
                      brandPrimary &&
                        "cursor-pointer focus:bg-brand-primary-50 focus:text-brand-dark-neutral-900"
                    )}
                  >
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Calendar */}
          <Calendar
            mode="single"
            selected={date}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            onSelect={(date) => {
              onDateChange?.(date)
              setOpen(false)
            }}
            disabled={disabledDays} // Pass disabled days to calendar
            className="rounded-md border-0"
            classNames={brandCalendarClassNames}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
