export class CustomError extends Error {
    constructor(status, message, err) {
        super(message);
        this.status = status;
        this.details = err || `An internal server error occurred.`;
    }
}
