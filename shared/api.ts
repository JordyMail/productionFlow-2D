/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 * You can replace this with your own types for your API responses
 */
export interface DemoResponse {
  message: string;
}
