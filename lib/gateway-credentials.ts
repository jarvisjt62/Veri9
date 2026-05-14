/**
 * getGatewayCredential(integrationName, adminFieldKey)
 *
 * Returns the credential value for a payment gateway.
 * Priority:
 *   1. Environment variable (STRIPE_SECRET_KEY etc.) — always wins
 *   2. Admin dashboard saved credentials (Supabase veri9_integrations table)
 *      stored under the integration display name (e.g. "PayPal", "Stripe")
 *      with the exact field keys used in the admin fieldMap
 *
 * This means admins can configure gateways entirely from the dashboard
 * WITHOUT needing to set Vercel environment variables.
 */
import { getCredential } from './integrations-store'

// Maps: { envVarName: [integrationDisplayName, adminFieldKey] }
// The adminFieldKey must match exactly what's in the admin page fieldMap
const ENV_FALLBACKS: Record<string, [string, string]> = {
  // Stripe
  STRIPE_SECRET_KEY:          ['Stripe',           'stripe_secret'],
  STRIPE_PUBLISHABLE_KEY:     ['Stripe',           'stripe_pub'],
  STRIPE_WEBHOOK_SECRET:      ['Stripe',           'stripe_webhook'],
  // PayPal
  PAYPAL_CLIENT_ID:           ['PayPal',           'paypal_client'],
  PAYPAL_CLIENT_SECRET:       ['PayPal',           'paypal_secret'],
  PAYPAL_MODE:                ['PayPal',           'paypal_mode'],
  // Paystack
  PAYSTACK_SECRET_KEY:        ['Paystack',         'paystack_secret'],
  PAYSTACK_PUBLIC_KEY:        ['Paystack',         'paystack_pub'],
  // Flutterwave
  FLUTTERWAVE_SECRET_KEY:     ['Flutterwave',      'flw_secret'],
  FLUTTERWAVE_PUBLIC_KEY:     ['Flutterwave',      'flw_pub'],
  // M-Pesa
  MPESA_CONSUMER_KEY:         ['M-Pesa',           'mpesa_key'],
  MPESA_CONSUMER_SECRET:      ['M-Pesa',           'mpesa_secret'],
  MPESA_SHORTCODE:            ['M-Pesa',           'mpesa_shortcode'],
  MPESA_PASSKEY:              ['M-Pesa',           'mpesa_passkey'],
  MPESA_ENV:                  ['M-Pesa',           'mpesa_env'],
  // Razorpay
  RAZORPAY_KEY_ID:            ['Razorpay',         'rzp_id'],
  RAZORPAY_KEY_SECRET:        ['Razorpay',         'rzp_secret'],
  // Mercado Pago
  MERCADOPAGO_ACCESS_TOKEN:   ['Mercado Pago',     'mp_token'],
  // Coinbase Commerce
  COINBASE_COMMERCE_API_KEY:  ['Coinbase Commerce','cb_api'],
  // SendGrid
  SENDGRID_API_KEY:           ['SendGrid',         'sendgrid_api'],
  SENDGRID_FROM_EMAIL:        ['SendGrid',         'sendgrid_from'],
}

/**
 * Get a credential by env var name.
 * Falls back to admin-saved credential if env var is not set.
 */
export async function getEnvOrAdmin(envVarName: string): Promise<string> {
  // 1. Try env var first
  if (process.env[envVarName]) return process.env[envVarName]!

  // 2. Fall back to admin dashboard saved value
  const fallback = ENV_FALLBACKS[envVarName]
  if (!fallback) return ''
  const [integrationName, fieldKey] = fallback
  return getCredential(integrationName, fieldKey)
}

// ─── Convenience functions for each gateway ───────────────────────────────────

export async function getStripeSecret(): Promise<string> {
  return getEnvOrAdmin('STRIPE_SECRET_KEY')
}

export async function getPayPalCreds(): Promise<{ clientId: string; clientSecret: string; mode: string }> {
  return {
    clientId:     await getEnvOrAdmin('PAYPAL_CLIENT_ID'),
    clientSecret: await getEnvOrAdmin('PAYPAL_CLIENT_SECRET'),
    mode:         await getEnvOrAdmin('PAYPAL_MODE') || 'live',
  }
}

export async function getPaystackSecret(): Promise<string> {
  return getEnvOrAdmin('PAYSTACK_SECRET_KEY')
}

export async function getFlutterwaveSecret(): Promise<string> {
  return getEnvOrAdmin('FLUTTERWAVE_SECRET_KEY')
}

export async function getMpesaCreds(): Promise<{
  consumerKey: string; consumerSecret: string;
  shortcode: string; passkey: string; env: string
}> {
  return {
    consumerKey:    await getEnvOrAdmin('MPESA_CONSUMER_KEY'),
    consumerSecret: await getEnvOrAdmin('MPESA_CONSUMER_SECRET'),
    shortcode:      await getEnvOrAdmin('MPESA_SHORTCODE'),
    passkey:        await getEnvOrAdmin('MPESA_PASSKEY'),
    env:            await getEnvOrAdmin('MPESA_ENV') || 'sandbox',
  }
}

export async function getRazorpayCreds(): Promise<{ keyId: string; keySecret: string }> {
  return {
    keyId:     await getEnvOrAdmin('RAZORPAY_KEY_ID'),
    keySecret: await getEnvOrAdmin('RAZORPAY_KEY_SECRET'),
  }
}

export async function getMercadoPagoToken(): Promise<string> {
  return getEnvOrAdmin('MERCADOPAGO_ACCESS_TOKEN')
}

export async function getCoinbaseApiKey(): Promise<string> {
  return getEnvOrAdmin('COINBASE_COMMERCE_API_KEY')
}

export async function getSendGridCreds(): Promise<{ apiKey: string; fromEmail: string }> {
  return {
    apiKey:    await getEnvOrAdmin('SENDGRID_API_KEY'),
    fromEmail: await getEnvOrAdmin('SENDGRID_FROM_EMAIL') || 'contact@veri9.com',
  }
}

// Keep backward-compat export used by older routes
export async function getGatewayCredential(gateway: string, field: string): Promise<string> {
  // Map old-style (gateway, field) calls to new env-based lookup
  const OLD_MAP: Record<string, Record<string, string>> = {
    stripe:      { secretKey: 'STRIPE_SECRET_KEY' },
    paypal:      { clientId: 'PAYPAL_CLIENT_ID', clientSecret: 'PAYPAL_CLIENT_SECRET', mode: 'PAYPAL_MODE' },
    paystack:    { secretKey: 'PAYSTACK_SECRET_KEY' },
    flutterwave: { secretKey: 'FLUTTERWAVE_SECRET_KEY' },
    mpesa:       { consumerKey: 'MPESA_CONSUMER_KEY', consumerSecret: 'MPESA_CONSUMER_SECRET', shortcode: 'MPESA_SHORTCODE', passkey: 'MPESA_PASSKEY', env: 'MPESA_ENV' },
    razorpay:    { keyId: 'RAZORPAY_KEY_ID', keySecret: 'RAZORPAY_KEY_SECRET' },
    alipay:      { secretKey: 'STRIPE_SECRET_KEY' },
    mercadopago: { accessToken: 'MERCADOPAGO_ACCESS_TOKEN' },
    crypto:      { apiKey: 'COINBASE_COMMERCE_API_KEY' },
    applepay:    { secretKey: 'STRIPE_SECRET_KEY' },
    googlepay:   { secretKey: 'STRIPE_SECRET_KEY' },
    sendgrid:    { apiKey: 'SENDGRID_API_KEY', fromEmail: 'SENDGRID_FROM_EMAIL' },
  }
  const envVar = OLD_MAP[gateway]?.[field]
  if (envVar) return getEnvOrAdmin(envVar)
  return ''
}

export async function getGatewayCredentials(gateway: string): Promise<Record<string, string>> {
  switch (gateway) {
    case 'stripe':
    case 'alipay':
    case 'applepay':
    case 'googlepay':
      return { secretKey: await getStripeSecret() }
    case 'paypal': {
      const c = await getPayPalCreds()
      return { clientId: c.clientId, clientSecret: c.clientSecret, mode: c.mode }
    }
    case 'paystack':
      return { secretKey: await getPaystackSecret() }
    case 'flutterwave':
      return { secretKey: await getFlutterwaveSecret() }
    case 'mpesa': {
      const c = await getMpesaCreds()
      return { consumerKey: c.consumerKey, consumerSecret: c.consumerSecret, shortcode: c.shortcode, passkey: c.passkey, env: c.env }
    }
    case 'razorpay': {
      const c = await getRazorpayCreds()
      return { keyId: c.keyId, keySecret: c.keySecret }
    }
    case 'mercadopago':
      return { accessToken: await getMercadoPagoToken() }
    case 'crypto':
      return { apiKey: await getCoinbaseApiKey() }
    case 'sendgrid': {
      const c = await getSendGridCreds()
      return { apiKey: c.apiKey, fromEmail: c.fromEmail }
    }
    default:
      return {}
  }
}
