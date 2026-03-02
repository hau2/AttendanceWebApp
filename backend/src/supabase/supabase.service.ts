import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient;
  private readonly url: string;
  private readonly anonKey: string;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.SUPABASE_ANON_KEY;

    if (!url || !serviceRoleKey || !anonKey) {
      throw new Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_ANON_KEY must be set');
    }

    this.url = url;
    this.anonKey = anonKey;

    // Service role client — bypasses RLS for backend admin operations.
    // Never expose this client or key to the frontend.
    // IMPORTANT: never call auth.signInWithPassword on this client — it would
    // overwrite the in-memory session and strip service-role privileges from
    // all subsequent requests on this shared singleton.
    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    });
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  // Returns a fresh anon client for credential verification (signInWithPassword).
  // A new instance is created each time so it never shares session state with
  // the service role client or other requests.
  createUserClient(): SupabaseClient {
    return createClient(this.url, this.anonKey, {
      auth: { persistSession: false },
    });
  }
}
