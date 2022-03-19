/**
 *
 * @param ms milliseconds (number)
 * @returns Promise with setTimeout
 */
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export default delay;
