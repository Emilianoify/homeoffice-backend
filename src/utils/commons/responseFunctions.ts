import { Response } from "express";
import { ERROR_MESSAGES } from "../constants/messages/error.messages";
import { HttpStatusCode } from "../enums/HttpStatusCode";

interface ApiResponse<T = any> {
  payload?: {
    code?: string;
    message?: string;
    data?: T;
  };
}

export function sendResponse<T>(
  res: Response,
  statusCode: HttpStatusCode,
  message: string,
  data?: T,
): void {
  const response: ApiResponse<T> = {
    payload: {
      code: statusCode.toString(),
      message: message,
      data: data,
    },
  };
  res.status(statusCode).send(response);
}

export const sendBadRequest = (res: Response, message: string) =>
  sendResponse(res, HttpStatusCode.BAD_REQUEST, message);

export const sendNotFound = (res: Response, message: string) =>
  sendResponse(res, HttpStatusCode.NOT_FOUND, message);

export const sendConflict = (res: Response, message: string) =>
  sendResponse(res, HttpStatusCode.CONFLICT, message);

export const sendSuccessResponse = <T>(
  res: Response,
  message: string,
  data?: T,
) => sendResponse(res, HttpStatusCode.CREATED, message, data);

export const sendInternalErrorResponse = (res: Response) =>
  sendResponse(
    res,
    HttpStatusCode.INTERNAL_SERVER_ERROR,
    ERROR_MESSAGES.SERVER.INTERNAL_ERROR,
  );

export const sendUnauthorized = (res: Response, message: string) =>
  sendResponse(res, HttpStatusCode.UNAUTHORIZED, message);
