import { Response } from "express";

interface ApiResponse<T = any> {
  payload?: {
    code?: string;
    message?: string;
    data?: T;
  };
}

export function sendBadRequest(
  res: Response,
  message: string,
  code: string = "400",
): void {
  const response: ApiResponse = {
    payload: {
      code: code,
      message: message,
    },
  };
  res.status(400).send(response);
}

export function sendSuccessResponse<T>(
  res: Response,
  message: string,
  code: string = "200",
  data?: T,
): void {
  const response: ApiResponse = {
    payload: {
      code: code,
      message: message,
      data: data,
    },
  };
  res.status(201).send(response);
}

export function sendInternalErrorResponse(res: Response): void {
  const response: ApiResponse = {
    payload: {
      code: "500",
      message: "Internal server error",
    },
  };
  res.status(500).send(response);
}
