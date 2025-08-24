import { PopupResult } from "../utils/enums/PopupResult";

export interface IPopupResponse {
  id?: string;
  userId: string;
  popupTime: Date;
  wasAnswered: boolean;
  responseTime: number;
  result: PopupResult;
  createdAt?: Date;
  updatedAt?: Date;
}
