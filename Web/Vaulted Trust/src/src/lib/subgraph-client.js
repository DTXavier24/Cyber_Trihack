const { hmac } = require("./crypto");

async function callSubgraph(url, secret, audience, payload) {
  const body = JSON.stringify(payload);
  const signature = hmac(secret, `${audience}\n${body}`);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-gateway-aud": audience,
      "x-gateway-signature": signature
    },
    body
  });

  const json = await response.json();
  if (json.errors) {
    const message = json.errors.map((error) => error.message).join("; ");
    throw new Error(`${audience} subgraph error: ${message}`);
  }
  return json.data;
}

function deepMergeTrustedRepresentation(base, overlay) {
  if (!overlay || typeof overlay !== "object" || Array.isArray(overlay)) {
    return base;
  }

  const merged = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    if (value && typeof value === "object" && !Array.isArray(value) && typeof merged[key] === "object") {
      merged[key] = deepMergeTrustedRepresentation(merged[key], value);
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

module.exports = { callSubgraph, deepMergeTrustedRepresentation };
