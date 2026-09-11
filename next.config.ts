import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@node-rs/argon2", "pdfkit"],
  outputFileTracingIncludes: {
    "/api/catalog/pdf": ["./public/catalog/**/*", "./public/asset/**/*", "./public/marketing/**/*"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "z4zi8ouylj.ufs.sh",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
