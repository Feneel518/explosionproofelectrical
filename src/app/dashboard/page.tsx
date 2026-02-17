import { requireAuth } from "@/lib/check/requireAuth";
import { FC } from "react";

interface pageProps {}

const page: FC<pageProps> = async ({}) => {
  await requireAuth();
  return <div>page</div>;
};

export default page;
