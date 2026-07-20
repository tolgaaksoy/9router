// ClinePass wraps non-streaming completions in { success, data }.
// Normalize that transport envelope before the standard OpenAI response flow.
export function unwrapClinepassEnvelope(body, provider) {
  if (provider !== "clinepass" || !body || typeof body !== "object" || Array.isArray(body) || !("success" in body)) {
    return { body, error: null };
  }

  if (body.success === false) {
    const message = typeof body.error === "string"
      ? body.error
      : body.error?.message || body.message || "Upstream error";
    return { body: null, error: { message, status: body.statusCode || null } };
  }

  if (body.success === true && body.data && typeof body.data === "object") {
    return { body: body.data, error: null };
  }

  return { body, error: null };
}
