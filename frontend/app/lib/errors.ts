export enum AuthErrorCode {
  EXPIRED = "EXPIRED",
  INVALID = "INVALID",
  NETWORK = "NETWORK",
  UNKNOWN = "UNKNOWN",
}

export class AuthError extends Error {
  code: AuthErrorCode;

  constructor(code: AuthErrorCode, message?: string) {
    super(message || code);
    this.code = code;
    this.name = "AuthError";
  }
}
