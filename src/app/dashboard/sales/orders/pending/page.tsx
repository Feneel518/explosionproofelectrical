import { redirect } from "next/navigation";

export default async function Page() {
  redirect("/dashboard/sales/pending");
}
