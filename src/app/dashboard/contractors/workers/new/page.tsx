import WorkerForm from "@/components/dashboard/contractors/WorkerForm";
import { FC } from "react";

interface pageProps {}

const page: FC<pageProps> = ({}) => {
  return (
    <div>
      <WorkerForm mode="create" />
    </div>
  );
};

export default page;
