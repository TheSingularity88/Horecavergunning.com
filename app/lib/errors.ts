/**
 * A required piece of server configuration is missing or empty.
 *
 * Distinct from an ordinary failure because the remedy is completely
 * different: no amount of retrying fixes a missing environment variable, so
 * telling the user "please try again" sends them into a loop.
 *
 * This exists because a blank SUPABASE_SERVICE_ROLE_KEY in a local .env.local
 * surfaced in the dashboard as "Something went wrong. Please try again." on
 * every action that touches the admin client — seventeen call sites across
 * nine files — and identifying it needed a dig through server logs.
 *
 * Plain module (no 'server-only'): the error class is thrown server-side, but
 * the code it maps to is read by client components.
 */
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}
