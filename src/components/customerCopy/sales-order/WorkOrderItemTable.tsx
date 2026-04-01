import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GetSalesOrderByIdData } from "@/lib/types/SalesOrderTypes";
import Image from "next/image";
import { FC } from "react";

interface WorkOrderItemTableProps {
  items: GetSalesOrderByIdData["items"];
  pageItemsStartIndex: number;
}

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) => {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "null"
  ) {
    return null;
  }

  return (
    <div className="grid grid-cols-[110px_1fr] gap-2 text-sm leading-6">
      <p className="font-medium ">{label}</p>
      <p className="text-wrap ">{value}</p>
    </div>
  );
};
const WorkOrderItemTable: FC<WorkOrderItemTableProps> = ({
  items,
  pageItemsStartIndex,
}) => {
  return (
    <div>
      <Table>
        <TableHeader className="">
          <TableRow className="border-muted-foreground!">
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead className="">Items</TableHead>
            <TableHead className="text-right w-[200px]">Quantity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((items, index) => {
            return (
              <TableRow key={items.id} className="">
                <TableCell className="font-medium">
                  {pageItemsStartIndex + index + 1}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold leading-tight ">
                        {items.product?.name || "Unnamed Product"}
                      </h3>

                      {items.variant?.variant ? (
                        <p className="text-sm ">
                          Variant: {items.variant.variant}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-1">
                      <DetailRow label="Rating" value={items.rating} />
                      <DetailRow label="Size" value={items.size} />
                      <DetailRow label="Cutout Size" value={items.cutoutSize} />
                      <DetailRow label="Plate Size" value={items.plateSize} />
                      <DetailRow label="Terminals" value={items.terminals} />
                      <DetailRow label="Cable Entry" value={items.cableEntry} />
                    </div>

                    {items.ComponentsOfProductInSalesOrder?.length ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium ">Components</p>

                        <div className="flex flex-wrap gap-2">
                          {items.ComponentsOfProductInSalesOrder.map(
                            (component) => (
                              <span
                                key={component.id}
                                className="inline-flex rounded-full border  px-3 py-1 text-xs font-medium ">
                                {component.item}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="text-right">{items.pendingQty}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <Separator className=" w-full"></Separator>
    </div>
  );
};

export default WorkOrderItemTable;

// import { Separator } from "@/components/ui/separator";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { GetSalesOrderByIdData } from "@/lib/types/SalesOrderTypes";
// import { FC } from "react";

// interface WorkOrderItemTableProps {
//   items: GetSalesOrderByIdData["items"];
//   pageItemsStartIndex: number;
// }

// const DetailRow = ({
//   label,
//   value,
// }: {
//   label: string;
//   value?: string | number | null;
// }) => {
//   if (
//     value === null ||
//     value === undefined ||
//     value === "" ||
//     value === "null"
//   ) {
//     return null;
//   }

//   return (
//     <div className="grid grid-cols-[110px_1fr] gap-2 text-sm leading-6">
//       <p className="font-medium text-muted-foreground">{label}</p>
//       <p className="break-words text-foreground">{value}</p>
//     </div>
//   );
// };

// const WorkOrderItemTable: FC<WorkOrderItemTableProps> = ({
//   items,
//   pageItemsStartIndex,
// }) => {
//   return (
//     <div className="overflow-hidden rounded-2xl border bg-background">
//       <Table>
//         <TableHeader>
//           <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
//             <TableHead className="w-[70px] py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
//               #
//             </TableHead>
//             <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
//               Item Details
//             </TableHead>
//             <TableHead className="w-[160px] py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
//               Quantity
//             </TableHead>
//           </TableRow>
//         </TableHeader>

//         <TableBody>
//           {items.map((item, index) => {
//             const serialNo = pageItemsStartIndex + index + 1;

//             return (
//               <TableRow
//                 key={item.id}
//                 className="align-top border-b last:border-b-0 hover:bg-transparent">
//                 <TableCell className="py-5 align-top">
//                   <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-muted/50 text-sm font-semibold">
//                     {serialNo}
//                   </div>
//                 </TableCell>

//                 <TableCell className="py-5 align-top">
//                   <div className="space-y-4">
//                     <div className="space-y-1">
//                       <h3 className="text-base font-semibold leading-tight text-foreground">
//                         {item.product?.name || "Unnamed Product"}
//                       </h3>

//                       {item.variant?.variant ? (
//                         <p className="text-sm text-muted-foreground">
//                           Variant: {item.variant.variant}
//                         </p>
//                       ) : null}
//                     </div>

//                     <div className="space-y-1">
//                       <DetailRow label="Rating" value={item.rating} />
//                       <DetailRow label="Size" value={item.size} />
//                       <DetailRow label="Cutout Size" value={item.cutoutSize} />
//                       <DetailRow label="Plate Size" value={item.plateSize} />
//                       <DetailRow label="Terminals" value={item.terminals} />
//                       <DetailRow label="Cable Entry" value={item.cableEntry} />
//                     </div>

//                     {item.ComponentsOfProductInSalesOrder?.length ? (
//                       <div className="space-y-2">
//                         <p className="text-sm font-medium text-muted-foreground">
//                           Components
//                         </p>

//                         <div className="flex flex-wrap gap-2">
//                           {item.ComponentsOfProductInSalesOrder.map(
//                             (component) => (
//                               <span
//                                 key={component.id}
//                                 className="inline-flex rounded-full border bg-muted px-3 py-1 text-xs font-medium text-foreground">
//                                 {component.item}
//                               </span>
//                             ),
//                           )}
//                         </div>
//                       </div>
//                     ) : null}
//                   </div>
//                 </TableCell>

//                 <TableCell className="py-5 text-right align-top">
//                   <div className="inline-flex min-w-[90px] flex-col items-end rounded-xl border bg-muted/30 px-4 py-3">
//                     <p className="text-xs uppercase tracking-wide text-muted-foreground">
//                       Pending
//                     </p>
//                     <p className="text-xl font-bold leading-none">
//                       {item.pendingQty ?? 0}
//                     </p>
//                   </div>
//                 </TableCell>
//               </TableRow>
//             );
//           })}
//         </TableBody>
//       </Table>

//       <Separator />
//     </div>
//   );
// };

// export default WorkOrderItemTable;
