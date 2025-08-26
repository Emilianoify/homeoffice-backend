import { AuditAction } from "../utils/enums/AuditAction";

export interface AuditEventData {
  action: AuditAction;
  description: string;
  targetUserId?: string;
  targetUserEmail?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  additionalData?: any;
}
