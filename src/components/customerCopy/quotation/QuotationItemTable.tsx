import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrencyINR } from "@/lib/helpers/globalHelpers/formatCurrency";
import { GetQuotationByIdData } from "@/lib/types/QuotationTypes";
import Image from "next/image";
import { FC } from "react";

interface QuotationItemTableProps {
  quotationItems: GetQuotationByIdData["items"];
  pageItemsStartIndex: number;
}

const QuotationItemTable: FC<QuotationItemTableProps> = ({
  quotationItems,
  pageItemsStartIndex,
}) => {
  return (
    <div>
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
            const variantImageUrl = items.variant?.images[0]?.url;
            const firstDrawing = Array.isArray(items.variantDrawingsSnapshot)
              ? items.variantDrawingsSnapshot[0]
              : null;
            const variantDrawingUrl =
              firstDrawing &&
              typeof firstDrawing === "object" &&
              !Array.isArray(firstDrawing) &&
              "url" in firstDrawing &&
              typeof firstDrawing.url === "string"
                ? firstDrawing.url
                : "";

            return (
              <TableRow key={items.id} className="">
                <TableCell className="font-medium">
                  {pageItemsStartIndex + index + 1}
                </TableCell>
                <TableCell className="max-w-[300px]!">
                  <div className="text-wrap">
                    <strong>&quot;ExEC&quot;</strong>
                    make <strong>{items.title}</strong> suitable for
                    installation in Hazardous location zone-1 & 2 as per IS:
                    5572/94.
                  </div>
                  {items.product?.flpType && (
                    <div className="flex ">
                      <p className="w-[120px]">Type</p>
                      <p>:{items.product.flpType}</p>
                    </div>
                  )}
                  {items.product?.protection && (
                    <div className="flex ">
                      <p className="w-[120px]">Protection</p>
                      <p>:{items.product?.protection}</p>
                    </div>
                  )}
                  {items.product?.gasGroup && (
                    <div className="flex ">
                      <p className="w-[120px]">Gas Group</p>
                      <p>:{items.product?.gasGroup}</p>
                    </div>
                  )}
                  {items.product?.material && (
                    <div className="flex ">
                      <p className="w-[120px]">Material</p>
                      <p>:{items.product?.material}</p>
                    </div>
                  )}

                  {items.product?.finish && (
                    <div className="flex ">
                      <p className="w-[120px]">Finish</p>
                      <p>:{items.product?.finish}</p>
                    </div>
                  )}

                  {items.rating ? (
                    <div className="flex ">
                      <p className="w-[120px]">Rating</p>
                      <p>:{items.rating}</p>
                    </div>
                  ) : (
                    items.variant?.rating && (
                      <div className="flex ">
                        <p className="w-[120px]">Rating</p>
                        <p>:{items.variant?.rating}</p>
                      </div>
                    )
                  )}

                  {items.size ? (
                    <div className="flex ">
                      <p className="w-[120px]">Size</p>
                      <p>:{items.size}</p>
                    </div>
                  ) : (
                    items.variant?.size && (
                      <div className="flex ">
                        <p className="w-[120px]">Size</p>
                        <p>:{items.variant?.size}</p>
                      </div>
                    )
                  )}
                  {items.rpm ? (
                    <div className="flex ">
                      <p className="w-[120px]">R.P.M</p>
                      <p>:{items.rpm}</p>
                    </div>
                  ) : (
                    items.variant?.rpm && (
                      <div className="flex ">
                        <p className="w-[120px]">R.P.M</p>
                        <p>:{items.variant?.rpm}</p>
                      </div>
                    )
                  )}
                  {items.kW ? (
                    <div className="flex ">
                      <p className="w-[120px]">K.W.</p>
                      <p>:{items.kW}</p>
                    </div>
                  ) : (
                    items.variant?.kW && (
                      <div className="flex ">
                        <p className="w-[120px]">K.W.</p>
                        <p>:{items.variant?.kW}</p>
                      </div>
                    )
                  )}
                  {items.horsePower ? (
                    <div className="flex ">
                      <p className="w-[120px]">H.P.</p>
                      <p>:{items.horsePower}</p>
                    </div>
                  ) : (
                    items.variant?.horsePower && (
                      <div className="flex ">
                        <p className="w-[120px]">H.P.</p>
                        <p>:{items.variant?.horsePower}</p>
                      </div>
                    )
                  )}

                  {items.ComponentsOfProductInQuotation.length > 0 &&
                  items.ComponentsOfProductInQuotation[0].componentsOfQuotation
                    .item !== "" ? (
                    <div className="flex ">
                      <p className="w-[120px] ">Components</p>
                      <div className="flex flex-col">
                        {items.ComponentsOfProductInQuotation.map(
                          (com, comIndex) => {
                            return (
                              <p
                                key={`${items.id}-custom-component-${comIndex}`}
                                className="w-[300px]">
                                :{com.componentsOfQuotation.item}
                                {com.componentsOfQuotation.unit
                                  ? ` - ${com.componentsOfQuotation.unit}`
                                  : ""}
                              </p>
                            );
                          },
                        )}
                      </div>
                    </div>
                  ) : (
                    items.variant?.components &&
                    items.variant?.components.length > 0 &&
                    items.variant?.components[0].component.item !== "" && (
                      <div className="flex ">
                        <p className="w-[120px] ">Components</p>
                        <div className="flex flex-col">
                          {items.variant.components.map((com, comIndex) => {
                            return (
                              <p
                                key={`${items.id}-variant-component-${comIndex}`}
                                className="w-[300px]">
                                :{com.component.item} - {com.component.unit}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                    )
                  )}

                  {items.cutoutSize ? (
                    <div className="flex ">
                      <p className="w-[120px]">Cutout Size</p>
                      <p>:{items.cutoutSize}</p>
                    </div>
                  ) : (
                    items.variant?.cutoutSize && (
                      <div className="flex ">
                        <p className="w-[120px]">Cutout Size</p>
                        <p>:{items.variant?.cutoutSize}</p>
                      </div>
                    )
                  )}
                  {items.plateSize ? (
                    <div className="flex ">
                      <p className="w-[120px]">Plate Size</p>
                      <p>:{items.plateSize}</p>
                    </div>
                  ) : (
                    items.variant?.plateSize && (
                      <div className="flex ">
                        <p className="w-[120px]">Plate Size</p>
                        <p>:{items.variant?.plateSize}</p>
                      </div>
                    )
                  )}
                  {items.glass ? (
                    <div className="flex ">
                      <p className="w-[120px]">Glass</p>
                      <p>:{items.glass}</p>
                    </div>
                  ) : (
                    items.variant?.glass && (
                      <div className="flex ">
                        <p className="w-[120px]">Glass</p>
                        <p>:{items.variant?.glass}</p>
                      </div>
                    )
                  )}
                  {items.wireGuard ? (
                    <div className="flex ">
                      <p className="w-[120px]">Wire Guard</p>
                      <p>:{items.wireGuard}</p>
                    </div>
                  ) : (
                    items.variant?.wireGuard && (
                      <div className="flex ">
                        <p className="w-[120px]">Wire Guard</p>
                        <p>:{items.variant?.wireGuard}</p>
                      </div>
                    )
                  )}
                  {items.terminals ? (
                    <div className="flex ">
                      <p className="w-[120px]">Terminals</p>
                      <p>:{items.terminals}</p>
                    </div>
                  ) : (
                    items.variant?.terminals && (
                      <div className="flex ">
                        <p className="w-[120px]">Terminals</p>
                        <p>:{items.variant?.terminals}</p>
                      </div>
                    )
                  )}
                  {items.hardware ? (
                    <div className="flex ">
                      <p className="w-[120px]">Hardware</p>
                      <p>:{items.hardware}</p>
                    </div>
                  ) : (
                    items.product?.hardware && (
                      <div className="flex ">
                        <p className="w-[120px]">Hardware</p>
                        <p>:{items.product?.hardware}</p>
                      </div>
                    )
                  )}
                  {items.gasket ? (
                    <div className="flex ">
                      <p className="w-[120px]">Gasket</p>
                      <p>:{items.gasket}</p>
                    </div>
                  ) : (
                    items.variant?.gasket && (
                      <div className="flex ">
                        <p className="w-[120px]">Gasket</p>
                        <p>:{items.variant?.gasket}</p>
                      </div>
                    )
                  )}
                  {items.mounting ? (
                    <div className="flex ">
                      <p className="w-[120px]">Mounting</p>
                      <p>:{items.mounting}</p>
                    </div>
                  ) : (
                    items.variant?.mounting && (
                      <div className="flex ">
                        <p className="w-[120px]">Mounting</p>
                        <p>:{items.variant?.mounting}</p>
                      </div>
                    )
                  )}
                  {items.cableEntry ? (
                    <div className="flex ">
                      <p className="min-w-[120px]">CableEntry</p>
                      <p className="text-wrap">:{items.cableEntry}</p>
                    </div>
                  ) : (
                    items.variant?.cableEntry && (
                      <div className="flex ">
                        <p className="w-[120px]">CableEntry</p>
                        <p>:{items.variant?.cableEntry}</p>
                      </div>
                    )
                  )}
                  {items.earthing ? (
                    <div className="flex ">
                      <p className="w-[120px]">Earthing</p>
                      <p>:{items.earthing}</p>
                    </div>
                  ) : (
                    items.variant?.earthing && (
                      <div className="flex ">
                        <p className="w-[120px]">earthing</p>
                        <p>:{items.variant?.earthing}</p>
                      </div>
                    )
                  )}
                  {items.typeNumber ? (
                    <div className="flex ">
                      <p className="w-[120px]">Type Number</p>
                      <p>:{items.typeNumber}</p>
                    </div>
                  ) : (
                    items.variant?.typeNumber && (
                      <div className="flex ">
                        <p className="w-[120px]">Type Number</p>
                        <p>:{items.variant?.typeNumber}</p>
                      </div>
                    )
                  )}
                  {items.hsnCode ? (
                    <div className="flex ">
                      <p className="w-[120px]">HSN Code</p>
                      <p>:{items.hsnCode}</p>
                    </div>
                  ) : (
                    items.product?.hsnCode && (
                      <div className="flex ">
                        <p className="w-[120px]">HSN Code</p>
                        <p>:{items.product?.hsnCode}</p>
                      </div>
                    )
                  )}

                  {items.showVariantDrawings && (
                    <div className="flex ">
                      <p className="w-[120px]">Drawing</p>
                      <a
                        href={variantDrawingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm underline">
                        View Drawing PDF
                      </a>
                    </div>
                  )}
                  {items.poReference && (
                    <div className="flex ">
                      <p className="w-[120px]">PO Reference</p>
                      <p>:{items.poReference}</p>
                    </div>
                  )}
                  {items.showVariantImages && variantImageUrl && (
                    <div className="w-full h-[150px] flex justify-start">
                      <Image
                        draggable={false}
                        src={variantImageUrl}
                        alt={items.title}
                        width={100}
                        height={150}
                        className="object-contain w-full object-top h-[150px]"></Image>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">{items.qty}</TableCell>
                <TableCell className="text-right">
                  {formatCurrencyINR(Number(items.unitPrice))}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <Separator className=" w-full"></Separator>
    </div>
  );
};

export default QuotationItemTable;
