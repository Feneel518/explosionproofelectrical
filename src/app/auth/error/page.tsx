import { FC } from "react";

interface pageProps {
  searchParams: Promise<{ error: string }>;
}

const page: FC<pageProps> = async ({ searchParams }) => {
  const sp = await searchParams;
  return (
    <div className="flex items-center justify-center min-h-screen  ">
      <div className="bg-red-100 p-8 text-center rounded-2xl flex flex-col items-center justify-center gap-6 text-xl">
        <div className="text-4xl">⛔</div>
        {sp.error === "invalid_token" || sp.error === "token_expired"
          ? "The verification link is invalid or has expired."
          : "Oops! Something went wrong."}
      </div>
    </div>
  );
};

export default page;
