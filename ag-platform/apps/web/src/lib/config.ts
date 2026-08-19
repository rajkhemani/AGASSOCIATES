// AG Associates Platform Configuration
// Central configuration for all domain connections and API endpoints

export const config = {
  // Application
  app: {
    name: 'AG Associates',
    description: 'Home Loan Origination Platform',
    version: '1.0.0',
    url: import.meta.env.VITE_APP_URL || 'http://localhost:3001',
    env: import.meta.env.NODE_ENV || 'development',
  },

  // Supabase Configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    serviceRoleKey: import.meta.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  // AI Backend (ag-associates-ai FastAPI)
  ai: {
    backendUrl: import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:8000',
    adminKey: import.meta.env.VITE_AI_ADMIN_KEY || '',
    wsUrl: import.meta.env.VITE_AI_WS_URL || 'ws://localhost:8000/ws',
  },

  // Email Service (Resend)
  email: {
    apiKey: import.meta.env.RESEND_API_KEY || '',
    from: 'noreply@advadiityagade.com',
  },

  // Telegram Bot
  telegram: {
    botToken: import.meta.env.TELEGRAM_BOT_TOKEN || '',
    webhookUrl: import.meta.env.TELEGRAM_WEBHOOK_URL || '',
  },

  // Dev Mode
  dev: {
    bypassAuth: import.meta.env.VITE_DEV_MODE === 'true',
  },

  // API Endpoints - orchestrated connections
  api: {
    // AI Backend endpoints
    ai: {
      base: import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:8000',
      chat: '/v1/chat/completions',
      embeddings: '/v1/embeddings',
      models: '/v1/models',
    },

    // Supabase endpoints
    supabase: {
      auth: `${import.meta.env.VITE_SUPABASE_URL || ''}/auth/v1`,
      realtime: `${import.meta.env.VITE_SUPABASE_URL || ''}/realtime/v1`,
      storage: `${import.meta.env.VITE_SUPABASE_URL || ''}/storage/v1`,
    },

    // Internal API endpoints
    internal: {
      cases: '/api/cases',
      documents: '/api/documents',
      payments: '/api/payments',
      notifications: '/api/notifications',
      noi: '/api/noi',
      email: '/api/email',
    },
  },

  // Webhook URLs for external services
  webhooks: {
    telegram: import.meta.env.TELEGRAM_WEBHOOK_URL || '/api/telegram/webhook',
    email: '/api/email/webhook',
    payment: '/api/payments/webhook',
  },

  // Feature flags
  features: {
    enableEmailIntake: true,
    enableNOIAutomation: true,
    enablePaymentOCR: true,
    enableRealTimeNotifications: true,
    enableTelegramBot: true,
  },

  // NOI Automation settings
  noi: {
    // State machine states
    states: [
      'PENDING_INTAKE',
      'DOCUMENTS_RECEIVED',
      'CHALLAN_GENERATED',
      'CHALLAN_PAID',
      'VERIFIED',
      'NOI_DROP_RECEIVED',
      'RECTIFY',
      'NOI_FILED',
      'ACKNOWLEDGED',
      'COMPLETED',
    ],
    // Zoho Mail configuration for email intake
    emailIntake: {
      host: 'imap.zoho.in',
      port: 993,
      user: 'admin@advadiityagade.com',
      pollInterval: 60, // seconds
    },
  },
};

// Helper function to get full API URL
export function getApiUrl(endpoint: string, base?: string): string {
  const baseUrl = base || config.ai.backendUrl;
  return `${baseUrl}${endpoint}`;
}

// Helper to check if we're in production
export function isProduction(): boolean {
  return config.app.env === 'production';
}

// Helper to check if dev mode bypass is enabled
export function isDevMode(): boolean {
  return config.dev.bypassAuth;
}

// Export all config as default
export default config;
