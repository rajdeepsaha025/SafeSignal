/**
 * ApiResponse.js
 * Standardised success response helper.
 *
 * Usage:
 *   res.status(200).json(ApiResponse.success({ user }, 'User fetched'));
 *   res.status(201).json(ApiResponse.created({ id }, 'Report submitted'));
 */

export class ApiResponse {
  /**
   * @param {boolean} success
   * @param {string}  message
   * @param {any}     [data]
   * @param {object}  [meta]   - Optional pagination / extras
   */
  constructor(success, message, data = null, meta = null) {
    this.success = success;
    this.message = message;
    this.timestamp = new Date().toISOString();

    if (data !== null) this.data = data;
    if (meta !== null) this.meta = meta;
  }

  /**
   * Creates a successful response envelope.
   * @param {any}    data
   * @param {string} [message]
   * @param {object} [meta]
   * @returns {ApiResponse}
   */
  static success(data = null, message = 'Success', meta = null) {
    return new ApiResponse(true, message, data, meta);
  }

  /**
   * Creates a 201 Created response envelope.
   * @param {any}    data
   * @param {string} [message]
   * @returns {ApiResponse}
   */
  static created(data = null, message = 'Resource created successfully') {
    return new ApiResponse(true, message, data);
  }

  /**
   * Creates a no-content response envelope (204 — body is typically omitted).
   * @param {string} [message]
   * @returns {ApiResponse}
   */
  static noContent(message = 'No content') {
    return new ApiResponse(true, message);
  }
}
