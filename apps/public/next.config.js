const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
disable: false,
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",       // static site — no Node server needed, deploys as plain files on Netlify
  trailingSlash: true,
  images: { unoptimized: true },
};

module.exports = nextConfig;
module.exports = withPWA(nextConfig);
