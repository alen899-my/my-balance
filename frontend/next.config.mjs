import withPWAInit from 'next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
}

export default withPWA(nextConfig)
