import {
  Controller,
  Post,
  UseGuards,
  Request,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SupabaseService } from '../supabase/supabase.service';

const BUCKET = 'attendance-photos';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class PhotoUploadController {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Generate a pre-signed upload URL for a single attendance photo.
   * The frontend captures a photo via getUserMedia (camera only — no file input),
   * then PUTs the blob directly to the returned signedUrl.
   * After upload, the frontend sends the permanentUrl as photo_url in check-in/out.
   *
   * Path format: {companyId}/{userId}/{timestamp}.jpg
   * This ensures tenant isolation at the storage path level even without bucket RLS.
   */
  @Post('photo-upload-url')
  async getPhotoUploadUrl(@Request() req: any) {
    const { userId, companyId } = req.user;
    const timestamp = Date.now();
    const path = `${companyId}/${userId}/${timestamp}.jpg`;

    const client = this.supabase.getClient();
    const { data, error } = await client.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data) {
      throw new InternalServerErrorException(
        `Failed to generate upload URL: ${error?.message ?? 'unknown error'}`,
      );
    }

    // Construct the permanent URL (valid once uploaded)
    const supabaseUrl = process.env.SUPABASE_URL;
    const permanentUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;

    return {
      signedUrl: data.signedUrl, // PUT your photo blob here (no auth needed — token in URL)
      permanentUrl, // Store this as photo_url in check-in/out request body
      path,
      expiresIn: 60, // seconds — upload must complete within 60s
    };
  }
}
