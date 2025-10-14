/**
 * Response Helper Utilities
 * Provides standardized response formatting across the application
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
    const response = {
        success: true,
        message,
        ...(data && { data })
    };
    
    return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {*} errors - Additional error details
 */
const sendError = (res, message = 'Something went wrong', statusCode = 400, errors = null) => {
    const response = {
        success: false,
        message,
        ...(errors && { errors })
    };
    
    return res.status(statusCode).json(response);
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Response data array
 * @param {Object} pagination - Pagination info
 * @param {string} message - Success message
 */
const sendPaginatedResponse = (res, data, pagination, message = 'Data retrieved successfully') => {
    const response = {
        success: true,
        message,
        data,
        pagination: {
            currentPage: pagination.page || 1,
            totalPages: pagination.totalPages || 1,
            totalItems: pagination.totalItems || data.length,
            itemsPerPage: pagination.limit || data.length,
            hasNext: pagination.hasNext || false,
            hasPrev: pagination.hasPrev || false
        }
    };
    
    return res.status(200).json(response);
};

/**
 * Send created response (201)
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} message - Success message
 */
const sendCreated = (res, data, message = 'Resource created successfully') => {
    return sendSuccess(res, data, message, 201);
};

/**
 * Send no content response (204)
 * @param {Object} res - Express response object
 */
const sendNoContent = (res) => {
    return res.status(204).send();
};

/**
 * Send not found response (404)
 * @param {Object} res - Express response object
 * @param {string} message - Not found message
 */
const sendNotFound = (res, message = 'Resource not found') => {
    return sendError(res, message, 404);
};

/**
 * Send unauthorized response (401)
 * @param {Object} res - Express response object
 * @param {string} message - Unauthorized message
 */
const sendUnauthorized = (res, message = 'Unauthorized access') => {
    return sendError(res, message, 401);
};

/**
 * Send forbidden response (403)
 * @param {Object} res - Express response object
 * @param {string} message - Forbidden message
 */
const sendForbidden = (res, message = 'Access forbidden') => {
    return sendError(res, message, 403);
};

/**
 * Send validation error response (422)
 * @param {Object} res - Express response object
 * @param {*} errors - Validation errors
 * @param {string} message - Error message
 */
const sendValidationError = (res, errors, message = 'Validation failed') => {
    return sendError(res, message, 422, errors);
};

/**
 * Send internal server error response (500)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const sendServerError = (res, message = 'Internal server error') => {
    return sendError(res, message, 500);
};

module.exports = {
    sendSuccess,
    sendError,
    sendPaginatedResponse,
    sendCreated,
    sendNoContent,
    sendNotFound,
    sendUnauthorized,
    sendForbidden,
    sendValidationError,
    sendServerError
};
