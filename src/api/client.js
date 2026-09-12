const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
export async function request(path, { method = 'GET', body } = {}) {
  const form = body instanceof FormData;
  let response;
  try {
    response = await fetch(`${base}${path}`, {
      method, headers: body && !form ? { 'Content-Type': 'application/json' } : undefined,
      body: body === undefined ? undefined : form ? body : JSON.stringify(body),
      signal: AbortSignal.timeout(135000),
    });
  } catch (cause) {
    throw new Error(cause.name === 'TimeoutError' ? 'The request timed out. Please retry.' : 'Cannot reach the backend. Check that the server is running.', { cause });
  }
  let data;
  try { data = await response.json(); }
  catch { throw new Error('The backend returned an invalid response. Check the server and API address.'); }
  if (!response.ok) {
    const error = new Error(data.message || `Request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return data;
}
