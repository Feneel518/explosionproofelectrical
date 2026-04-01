import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FC } from "react";

type DeliveryChallanItemView = {
  id: string;
  kind: string;
  productVariantId: string | null;
  title: string;
  sku: string | null;
  typeNumber: string | null;
  description: string | null;
  hsnCode: string | null;
  unit: string | null;
  qty: number;
  closedQty: number;
  pendingQty: number;
  sortOrder: number;
};
interface DeliveryChallanItemTableProps {
  quotationItems: DeliveryChallanItemView[];
  pageItemsStartIndex: number;
}

const DeliveryChallanItemTable: FC<DeliveryChallanItemTableProps> = ({
  pageItemsStartIndex,
  quotationItems,
}) => {
  return (
    <div className="">
      <Table>
        <TableHeader className="">
          <TableRow className="border-muted-foreground!">
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead className="w-[500px]">Items</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotationItems.map((items, index) => {
            return (
              <TableRow key={items.id} className="">
                <TableCell className="font-medium">
                  {pageItemsStartIndex + index + 1}
                </TableCell>
                <TableCell className="">
                  <div className="text-wrap max-w-[90%]">
                    <strong>"ExEC"</strong>
                    make <strong>{items.title}</strong> suitable for
                    installation in Hazardous location zone-1 & 2 as per IS:
                    5572/94.
                  </div>

                  {items.description && (
                    <div className="flex ">
                      <p className="w-[120px]">Description</p>
                      <p>:{items.description}</p>
                    </div>
                  )}
                  {items.typeNumber && (
                    <div className="flex ">
                      <p className="w-[120px]">Type Number</p>
                      <p>:{items.typeNumber}</p>
                    </div>
                  )}
                  {items.hsnCode && (
                    <div className="flex ">
                      <p className="w-[120px]">HSN Code</p>
                      <p>:{items.hsnCode}</p>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">{items.qty}</TableCell>
                <TableCell className="text-right">{items.unit}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <Separator className=" w-full"></Separator>
    </div>
  );
};

export default DeliveryChallanItemTable;
