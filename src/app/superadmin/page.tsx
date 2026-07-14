import { requireAuth } from "@/lib/check/requireAuth";
import type { Metadata } from "next";
import { FC } from "react";

interface pageProps {}

export const metadata: Metadata = {
  title: "Superadmin",
  robots: {
    index: false,
    follow: false,
  },
};

const page: FC<pageProps> = async ({}) => {
  await requireAuth();
  return <div>page</div>;
};

export default page;
