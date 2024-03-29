class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.errorData = message;
    if (message._message) {
      this.errorData = Object.values(message.errors)[0];
    }
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
  }
}

module.exports = AppError;
