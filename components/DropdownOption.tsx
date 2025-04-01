import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function DropdownOption({
  option,
  index,
  updateDropdownOption,
  addDropdownValue,
  removeDropdownOption,
}: any) {
  return (
    <div className="space-y-2 mt-4">
      <div className="flex items-center gap-x-4">
        <Input
          placeholder="Dropdown Label (e.g., Size)"
          value={option.label}
          onChange={(e) => updateDropdownOption(index, "label", e.target.value)}
        />
        <Button
          variant="destructive"
          type="button"
          onClick={() => removeDropdownOption(index)}
        >
          Remove
        </Button>
      </div>
      {option.values.map((value: string, valueIndex: number) => (
        <div key={valueIndex} className="flex items-center gap-x-4">
          <Input
            placeholder="Option Value (e.g., Small)"
            value={value}
            onChange={(e) => {
              const newValues = [...option.values];
              newValues[valueIndex] = e.target.value;
              updateDropdownOption(index, "values", newValues);
            }}
          />
        </div>
      ))}
      <Button
        variant="outline"
        type="button"
        onClick={() => addDropdownValue(index)}
        className="mt-2"
      >
        Add Value
      </Button>
    </div>
  );
}
