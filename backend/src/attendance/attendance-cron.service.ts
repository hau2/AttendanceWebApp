import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AttendanceCronService {
  private readonly logger = new Logger(AttendanceCronService.name);

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Runs at 00:05 UTC every day.
   * Marks attendance records as missing_checkout=true when:
   *   - Employee checked in (check_in_at IS NOT NULL)
   *   - Employee never checked out (check_out_at IS NULL)
   *   - The work_date is before today in the company's timezone
   *   - Record not already marked (missing_checkout = false)
   *
   * Strategy: fetch all companies, compute "today in their timezone",
   * then batch-update matching records for each company.
   * This correctly handles multi-timezone companies in a single job.
   */
  @Cron('5 0 * * *', { name: 'missing-checkout-cron', timeZone: 'UTC' })
  async markMissingCheckouts(): Promise<void> {
    this.logger.log('Running missing checkout cron...');
    const client = this.supabase.getClient();

    // 1. Fetch all companies (only id and timezone needed)
    const { data: companies, error: compErr } = await client
      .from('companies')
      .select('id, timezone');

    if (compErr || !companies) {
      this.logger.error(`Failed to fetch companies: ${compErr?.message}`);
      return;
    }

    let totalUpdated = 0;

    for (const company of companies) {
      try {
        // 2. Compute today's date in company timezone as YYYY-MM-DD
        const todayInCompanyTz = new Date().toLocaleDateString('en-CA', {
          timeZone: company.timezone || 'UTC',
        }); // en-CA locale produces YYYY-MM-DD format natively

        // 3. Update all records for this company where:
        //    - work_date < today (in company TZ)
        //    - checked in (check_in_at not null)
        //    - not checked out (check_out_at is null)
        //    - not already marked
        const { data, error } = await client
          .from('attendance_records')
          .update({
            missing_checkout: true,
            source: 'system',
            updated_at: new Date().toISOString(),
          })
          .eq('company_id', company.id)
          .eq('missing_checkout', false)
          .not('check_in_at', 'is', null)
          .is('check_out_at', null)
          .lt('work_date', todayInCompanyTz)
          .select('id');

        if (error) {
          this.logger.error(
            `Company ${company.id} missing checkout update failed: ${error.message}`,
          );
        } else {
          const count = data?.length ?? 0;
          totalUpdated += count;
          if (count > 0) {
            this.logger.log(
              `Company ${company.id}: marked ${count} records as missing_checkout`,
            );
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Company ${company.id} cron error: ${msg}`);
      }
    }

    this.logger.log(
      `Missing checkout cron complete. Total updated: ${totalUpdated}`,
    );
  }
}
