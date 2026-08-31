/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",       // static site — no Node server needed, deploys as plain files on Netlify
  trailingSlash: true,
  images: { unoptimized: true },
};

module.exports = nextConfig;
