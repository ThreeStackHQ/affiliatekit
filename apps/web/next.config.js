/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@affiliatekit/db'],
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
  },
}

module.exports = nextConfig
