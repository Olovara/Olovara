import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

interface CraftShowCostsProps {
  transactionFeePercent: number;
  setTransactionFeePercent: (value: number) => void;
  transactionFeeDollar: number;
  setTransactionFeeDollar: (value: number) => void;
  boothFee: number;
  setBoothFee: (value: number) => void;
  averageItemsSold: number;
  setAverageItemsSold: (value: number) => void;
  transactionFees: number;
  totalBoothFees: number;
  updateField: (
    setState: Function,
    stateArray: any[],
    index: number,
    field: string,
    value: string
  ) => void;
}

export default function CraftShowCostsSection({
  transactionFeePercent,
  setTransactionFeePercent,
  transactionFeeDollar,
  setTransactionFeeDollar,
  boothFee,
  setBoothFee,
  averageItemsSold,
  setAverageItemsSold,
  transactionFees,
  totalBoothFees,
  updateField,
}: CraftShowCostsProps) {
  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Craft Show Costs</h2>

      {/* Card Fees */}
      <h3 className="text-md font-semibold mt-4">Card Fees</h3>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Transaction Fee %</TableCell>
            <TableCell>
              <Input
                type="number"
                value={transactionFeePercent}
                onChange={(e) =>
                  setTransactionFeePercent(parseFloat(e.target.value || "0"))
                }
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Transaction Fee $</TableCell>
            <TableCell>
              <Input
                type="number"
                value={transactionFeeDollar}
                onChange={(e) =>
                  setTransactionFeeDollar(parseFloat(e.target.value || "0"))
                }
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <p className="mt-2 font-semibold">
        Total Card Fees: ${transactionFees.toFixed(2)}
      </p>

      {/* Booth Fees */}
      <h3 className="text-md font-semibold mt-4">Booth Fee</h3>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Average Booth Fee</TableCell>
            <TableCell>
              <Input
                type="number"
                value={boothFee}
                onChange={(e) => setBoothFee(parseFloat(e.target.value || "0"))}
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Average Items Sold</TableCell>
            <TableCell>
              <Input
                type="number"
                value={averageItemsSold}
                onChange={(e) =>
                  setAverageItemsSold(parseFloat(e.target.value || "1"))
                }
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <p className="mt-2 font-semibold">
        Total Booth Fees: ${totalBoothFees.toFixed(2)}
      </p>
    </div>
  );
}
