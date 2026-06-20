export class CustomerNotificationSendServiceError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "CustomerNotificationSendServiceError";
    this.status = status;
    this.code = code;
  }
}

export function customerNotificationSendError(
  status: number,
  code: string,
  message: string
) {
  return new CustomerNotificationSendServiceError(status, code, message);
}
