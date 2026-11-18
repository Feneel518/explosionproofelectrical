export const AUTH_UNAVAILABLE_MESSAGE =
  "Sign-in is temporarily unavailable. Please try again later or contact your administrator.";

// Keep provider errors and connection details out of authentication responses.
export async function handleAuthRequest(
  request: Request,
  handler: (request: Request) => Promise<Response>,
): Promise<Response> {
  try {
    const response = await handler(request);
    if (response.status < 500) return response;
    console.error("Authentication service returned a server error", {
      status: response.status,
      path: new URL(request.url).pathname,
    });
  } catch (error) {
    console.error("Authentication service unavailable", error);
  }

  return Response.json(
    { code: "AUTH_SERVICE_UNAVAILABLE", message: AUTH_UNAVAILABLE_MESSAGE },
    {
      status: 503,
      headers: { "Cache-Control": "no-store", "Retry-After": "60" },
    },
  );
}
