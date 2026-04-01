import { FC } from "react";

interface pageProps {
  searchParams: Promise<{ error: string }>;
}

const page: FC<pageProps> = async ({ searchParams }) => {
  const sp = await searchParams;
  return (
    <div className="flex items-center justify-center min-h-screen flex-col ">
      <div className="bg-green-100 p-8 text-center rounded-2xl flex flex-col items-center justify-center gap-6 text-xl">
        <div className="text-4xl">✅</div>
        <p className="text-lg">Verification email sent successfully!</p>
      </div>
    </div>
  );
};

export default page;
