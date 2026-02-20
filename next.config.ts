import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@node-rs/argon2"],
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
