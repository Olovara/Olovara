import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

interface WebsiteCostsProps {
  transactionFeePercent: number;
  setTransactionFeePercent: (value: number) => void;
  transactionFeeDollar: number;
  setTransactionFeeDollar: (value: number) => void;
  websiteFeePercent: number;
  setWebsiteFeePercent: (value: number) => void;
  websiteFeeDollar: number;
  setWebsiteFeeDollar: (value: number) => void;
  transactionFees: number;
  websiteFees: number;
}

export default function WebsiteCostsSection({
  transactionFeePercent,
  setTransactionFeePercent,
  transactionFeeDollar,
  setTransactionFeeDollar,
  websiteFeePercent,
  setWebsiteFeePercent,
  websiteFeeDollar,
  setWebsiteFeeDollar,
  transactionFees,
  websiteFees,
}: WebsiteCostsProps) {
  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Website Costs</h2>

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

      {/* Website Fees */}
      <h3 className="text-md font-semibold mt-4">Website Fees</h3>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Website Fee %</TableCell>
            <TableCell>
              <Input
                type="number"
                value={websiteFeePercent}
                onChange={(e) =>
                  setWebsiteFeePercent(parseFloat(e.target.value || "0"))
                }
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Website Fee $</TableCell>
            <TableCell>
              <Input
                type="number"
                value={websiteFeeDollar}
                onChange={(e) =>
                  setWebsiteFeeDollar(parseFloat(e.target.value || "0"))
                }
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <p className="mt-2 font-semibold">
        Total Website Fees: ${websiteFees.toFixed(2)}
      </p>
    </div>
  );
}
