import Medusa from "@medusajs/js-sdk"

// The dashboard is served by the same Medusa server, so the session cookie
// already authenticates every request.
export const sdk = new Medusa({
  baseUrl: "/",
  auth: { type: "session" },
})
