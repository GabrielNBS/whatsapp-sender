export async function register() {
  // Keep this hook side-effect free during Next's standalone trace phase.
  // The scheduler is started lazily by dynamic API routes that run in Node.js.
}
