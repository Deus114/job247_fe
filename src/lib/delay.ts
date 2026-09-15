/** Simulate network latency in mock mode. */
export function delay(ms = 200): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
