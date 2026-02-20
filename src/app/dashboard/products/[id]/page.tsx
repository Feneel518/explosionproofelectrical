import ProductForm from "@/components/dashboard/product/ProductForm";
import VariantsSection from "@/components/dashboard/product/ProductVariantSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FC } from "react";

interface pageProps {
  params: Promise<{
    id: string;
  }>;
}

const page: FC<pageProps> = async ({ params }) => {
  const { id } = await params;
  if (!id) {
    redirect("/dashboard/products");
  }

  const product = await prisma.product.findUnique({
    where: {
      id: id,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      categoryId: true,
      slug: true,
      flpType: true,
      protection: true,
      gasGroup: true,
      material: true,
      finish: true,
      hardware: true,
      hsnCode: true,
      zones: true,
      status: true,
      shortDesc: true,
      longDesc: true,
      deletedAt: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      variants: {
        include: {
          drawings: true,
          images: true,
          components: {
            include: {
              component: true,
            },
          },
        },
      },
    },
  });
  if (!product) {
    redirect("/dashboard/products");
  }
  const variants = product.variants.map((vari) => {
    // console.log(vari.components);

    return {
      id: vari.id,
      cableEntry: vari.cableEntry,
      component: vari.components.map((comp) => {
        return {
          id: comp.id,
          item: comp.component.item,
          unit: comp.component.unit,
        };
      }),
      cutoutSize: vari.cutoutSize,
      earthing: vari.earthing,
      gasket: vari.gasket,
      glass: vari.glass,
      horsePower: vari.horsePower,
      kW: vari.kW,
      mounting: vari.mounting,
      plateSize: vari.plateSize,
      productId: vari.productId,
      rpm: vari.rpm,
      size: vari.size,
      sku: vari.sku,
      terminals: vari.terminals,
      typeNumber: vari.typeNumber,
      variant: vari.variant,
      wireGuard: vari.wireGuard,
      rating: vari.rating,
      status: vari.status,
      image: vari.images.map((img) => {
        return {
          id: img.id,
          kind: img.kind,
          title: img.title,
          url: img.url,
        };
      }),
      drawings: vari.drawings.map((img) => {
        return {
          id: img.id,
          kind: img.kind,
          title: img.title,
          url: img.url,
        };
      }),
    };
  });
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {product.name}
            </h1>
            <Badge
              variant={product.status === "ACTIVE" ? "default" : "secondary"}>
              {product.status}
            </Badge>
            {product.deletedAt ? (
              <Badge variant="destructive">DELETED</Badge>
            ) : null}
          </div>
          <div className="text-sm text-muted-foreground">
            Slug: <span className="font-mono">{product.slug}</span> • Category:{" "}
            <span className="font-medium">{product.category.name}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/products">Back</Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/products/${product.id}/edit`}>Edit</Link>
          </Button>
        </div>
      </div>

      <Separator />

      {/* Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-4 space-y-2">
          <div className="text-sm font-medium">Technical</div>
          <div className="text-sm text-muted-foreground">
            {/* <div>FLP Type: {product.flpType ?? "—"}</div>
            <div>Protection: {product.protection ?? "—"}</div>
            <div>Gas Group: {product.gasGroup ?? "—"}</div>
            <div>Material: {product.material ?? "—"}</div>
            <div>Finish: {product.finish ?? "—"}</div>
            <div>Hardware: {product.hardware ?? "—"}</div>
            <div>HSN: {product.hsnCode ?? "—"}</div> */}
            <div className="grid grid-cols-3">
              <div className="">Flameproof Type</div>
              <div className="col-span-2">: {product.flpType ?? "-"}</div>
            </div>
            <div className="grid grid-cols-3">
              <div className="">Protection</div>
              <div className="col-span-2">: {product.protection ?? "-"}</div>
            </div>
            <div className="grid grid-cols-3">
              <div className="">Gas Group</div>
              <div className="col-span-2">: {product.gasGroup ?? "-"}</div>
            </div>
            <div className="grid grid-cols-3">
              <div className="">Material</div>
              <div className="col-span-2">: {product.material ?? "-"}</div>
            </div>
            <div className="grid grid-cols-3">
              <div className="">Finish</div>
              <div className="col-span-2">: {product.finish ?? "-"}</div>
            </div>
            <div className="grid grid-cols-3">
              <div className="">Hardware</div>
              <div className="col-span-2">: {product.hardware ?? "-"}</div>
            </div>
            <div className="grid grid-cols-3">
              <div className="">HSN</div>
              <div className="col-span-2">: {product.hsnCode ?? "-"}</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border p-4 space-y-2">
          <div className="text-sm font-medium">Zones</div>
          <div className="flex flex-wrap gap-2">
            {product.zones?.length ? (
              product.zones.map((z) => (
                <Badge key={z} variant="outline">
                  {z}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>

          <Separator className="my-3" />

          <div className="text-sm font-medium">SEO</div>
          <div className="text-sm text-muted-foreground">
            <div>Short: {product.shortDesc ?? "—"}</div>
            <div className="mt-2 line-clamp-3">
              Long: {product.longDesc ?? "—"}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Variants */}
      <VariantsSection
        productId={product.id}
        variants={variants}
        productName={product.name}
      />
    </div>
  );
};

export default page;
