import { z } from 'zod';

/**
 * The firm's panel, as published in apps/web/src/content/site.ts.
 *
 * The previous list named two institutions the firm does not act for and
 * rejected three that it does — Karur Vysya, Cholamandalam and Easy Home
 * Finance would each have been turned away with an HTTP 400.
 *
 * Short codes rather than full legal names, since this is a wire format the
 * bank's own system populates. Keep in step with the published panel.
 */
export const bankNames = [
  'KOTAK_BANK',
  'KOTAK_PRIME',
  'AXIS_FINANCE',
  'KARUR_VYSYA',
  'CHOLAMANDALAM',
  'MUTHOOT_HOMEFIN',
  'EASY_HOME_FINANCE',
] as const;

export const intakePayloadSchema = z.object({
  email_path: z
    .string()
    .regex(
      /^(https?|s3|gs):\/\/.+/,
      { message: 'email_path must be a valid URL (http(s)://, s3://, or gs://)' },
    ),
  bank_name: z.enum(bankNames, {
    errorMap: () => ({ message: `bank_name must be one of: ${bankNames.join(', ')}` }),
  }),
  sender_email: z.string().email().optional(),
  received_timestamp: z.string().datetime().optional(),
});

export type IntakePayload = z.infer<typeof intakePayloadSchema>;

/** One of the firm's panel institutions. */
export type BankName = (typeof bankNames)[number];
