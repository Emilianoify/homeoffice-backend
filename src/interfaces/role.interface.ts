export interface IRole {
  id: string;
  name: string;
  description?: string | null;
  permissions?: string[] | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
