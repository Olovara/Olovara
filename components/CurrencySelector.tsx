import { useCurrency } from '@/hooks/useCurrency';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function CurrencySelector() {
  const { currency, setCurrency, SUPPORTED_CURRENCIES } = useCurrency();

  return (
    <Select
      value={currency}
      onValueChange={(value) => setCurrency(value as any)}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_CURRENCIES.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            {currency.symbol} {currency.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 