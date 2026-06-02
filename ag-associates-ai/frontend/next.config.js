/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.GITHUB_PAGES ? 'export' : 'standalone',
  images: { unoptimized: true },
}

module.exports = nextConfig
