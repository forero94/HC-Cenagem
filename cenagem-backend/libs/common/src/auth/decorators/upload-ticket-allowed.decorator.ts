import { SetMetadata } from '@nestjs/common';
import { UPLOAD_TICKET_ALLOWED_KEY } from '../auth.constants';

/**
 * Marks a route as accessible for scoped upload-ticket sessions.
 */
export const UploadTicketAllowed = () =>
  SetMetadata(UPLOAD_TICKET_ALLOWED_KEY, true);
