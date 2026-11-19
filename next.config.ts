import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/about-us", destination: "/story", statusCode: 301 },
      { source: "/contact-us", destination: "/contact", statusCode: 301 },
    ];
  },
  async headers() {
    return [{ source: "/design-preview/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }] }];
  },
  serverExternalPackages: ["@node-rs/argon2", "pdfkit", "pdf-parse", "playwright-core", "@sparticuz/chromium"],
  outputFileTracingIncludes: {
    "/dashboard/inbox": ["./node_modules/pdf-parse/dist/**/*"],
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
