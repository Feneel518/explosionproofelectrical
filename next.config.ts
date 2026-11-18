import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@node-rs/argon2", "pdfkit", "playwright-core", "@sparticuz/chromium"],
  outputFileTracingIncludes: {
    "/api/quotations/*/pdf": ["./node_modules/@sparticuz/chromium/**/*", "./node_modules/playwright-core/**/*"],
    "/dashboard/sales/quotations/*": ["./node_modules/@sparticuz/chromium/**/*", "./node_modules/playwright-core/**/*"],
    "/api/catalog/pdf": ["./public/catalog/**/*", "./public/asset/**/*", "./public/marketing/**/*"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "z4zi8ouylj.ufs.sh",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.ufs.sh",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
