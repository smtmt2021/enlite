/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
const isTesting = process.env.NODE_ENV === 'test';
export const TIMEOUT_GET = (isTesting ? 1 : 10) * 1000;
