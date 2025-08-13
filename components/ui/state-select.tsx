"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useStates, useAllCountriesStates } from "@/hooks/use-states";
import { StateProvince } from "@/data/states";

interface StateSelectProps {
  countryCode?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showSearch?: boolean;
  emptyOptionLabel?: string;
  includeEmptyOption?: boolean;
}

/**
 * StateSelect component for selecting states/provinces
 * Automatically loads states based on the selected country
 */
export function StateSelect({
  countryCode,
  value,
  onValueChange,
  placeholder = "Select a state/province",
  disabled = false,
  className,
  showSearch = true,
  emptyOptionLabel = "Select a state/province",
  includeEmptyOption = true,
}: StateSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  // Get states for the selected country
  const { states, loading, hasStates, getStateByCode } = useStates({
    countryCode,
    includeEmptyOption,
    emptyOptionLabel,
  });

  // Get the selected state
  const selectedState = React.useMemo(() => {
    if (!value) return null;
    return getStateByCode(value);
  }, [value, getStateByCode]);

  // Filter states based on search
  const filteredStates = React.useMemo(() => {
    if (!searchValue.trim()) return states;
    
    const term = searchValue.toLowerCase();
    return states.filter(state => 
      state.name.toLowerCase().includes(term) ||
      state.code.toLowerCase().includes(term)
    );
  }, [states, searchValue]);

  // Handle state selection
  const handleSelect = (currentValue: string) => {
    onValueChange?.(currentValue);
    setOpen(false);
    setSearchValue("");
  };

  // If country has no states, show a message
  if (countryCode && !hasStates) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        No states/provinces available for this country
      </div>
    );
  }

  // If no country is selected, show placeholder
  if (!countryCode) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        Please select a country first
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled || loading}
        >
          {loading ? (
            "Loading states..."
          ) : selectedState ? (
            selectedState.name
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          {showSearch && (
            <CommandInput
              placeholder="Search states..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
          )}
          <CommandList>
            <CommandEmpty>No state found.</CommandEmpty>
            <CommandGroup>
              {filteredStates.map((state) => (
                <CommandItem
                  key={state.code}
                  value={state.code}
                  onSelect={() => handleSelect(state.code)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === state.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{state.name}</span>
                    {state.code && (
                      <span className="text-xs text-muted-foreground">
                        {state.code} • {state.type}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * CountryStateSelect component for selecting both country and state
 * Provides a two-step selection process
 */
interface CountryStateSelectProps {
  countryValue?: string;
  stateValue?: string;
  onCountryChange?: (countryCode: string) => void;
  onStateChange?: (stateCode: string) => void;
  disabled?: boolean;
  className?: string;
  showSearch?: boolean;
  includeEmptyOption?: boolean;
}

export function CountryStateSelect({
  countryValue,
  stateValue,
  onCountryChange,
  onStateChange,
  disabled = false,
  className,
  showSearch = true,
  includeEmptyOption = true,
}: CountryStateSelectProps) {
  const { countriesStates, loading } = useAllCountriesStates();

  // Get countries that have states data
  const countriesWithStates = React.useMemo(() => {
    return Object.entries(countriesStates).map(([code, data]) => ({
      code,
      name: data.countryName,
    }));
  }, [countriesStates]);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Country Selection */}
      <div>
        <label className="text-sm font-medium">Country</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between mt-1"
              disabled={disabled || loading}
            >
              {loading ? (
                "Loading countries..."
              ) : countryValue ? (
                countriesWithStates.find(country => country.code === countryValue)?.name || countryValue
              ) : (
                "Select a country"
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Search countries..." />
              <CommandList>
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                  {countriesWithStates.map((country) => (
                    <CommandItem
                      key={country.code}
                      value={country.code}
                      onSelect={() => {
                        onCountryChange?.(country.code);
                        // Reset state when country changes
                        onStateChange?.("");
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          countryValue === country.code ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {country.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* State Selection */}
      {countryValue && (
        <div>
          <label className="text-sm font-medium">State/Province</label>
          <StateSelect
            countryCode={countryValue}
            value={stateValue}
            onValueChange={onStateChange}
            disabled={disabled}
            showSearch={showSearch}
            includeEmptyOption={includeEmptyOption}
            className="mt-1"
          />
        </div>
      )}
    </div>
  );
}
