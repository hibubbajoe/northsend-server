export class Transfer {
  id: string;
  sender_email: string;
  recipient_emails: string[];
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'expired';
  file_count: number;
  total_size: number;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}
