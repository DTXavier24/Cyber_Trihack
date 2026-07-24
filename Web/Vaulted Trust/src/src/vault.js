const express = require("express");
const fs = require("fs");
const path = require("path");
const { buildSchema } = require("graphql");
const { executeGraphQL } = require("./lib/graphql-http");
const { hmac, timingSafeEqualHex } = require("./lib/crypto");

const PORT = Number(process.env.PORT || 3002);
const GATEWAY_SECRET = process.env.GATEWAY_SECRET || "dev-gateway-secret";
const FLAG = process.env.GZCTF_FLAG || "TriHack{test-flag}";

function verifyGateway(req, audience) {
  const body = JSON.stringify(req.body || {});
  const expected = hmac(GATEWAY_SECRET, `${audience}\n${body}`);
  return req.header("x-gateway-aud") === audience &&
    timingSafeEqualHex(req.header("x-gateway-signature"), expected);
}

function isBreakGlass(representation) {
  return representation &&
    representation.__typename === "User" &&
    representation.tenantId === "tenant-root" &&
    representation.clearance === "root" &&
    Array.isArray(representation.delegatedScopes) &&
    representation.delegatedScopes.includes("vault:breakglass");
}

const schema = buildSchema(`
  type Query {
    _entities(representations: String!): [VaultUser!]!
    _service: Service!
  }

  type Service {
    name: String!
    sdl: String!
  }

  type VaultUser {
    id: ID!
    status: String!
    exportEnvelope: String!
    flag: String
  }
`);

const rootValue = {
  _entities: ({ representations }, context) => {
    if (!verifyGateway(context.req, "vault")) {
      throw new Error("unsigned subgraph request");
    }

    let parsed;
    try {
      parsed = JSON.parse(representations);
    } catch {
      throw new Error("invalid federated representations");
    }

    if (!Array.isArray(parsed)) {
      throw new Error("representations must be an array");
    }

    return parsed.map((representation) => ({
      id: representation.id,
      status: isBreakGlass(representation) ? "unsealed" : "locked",
      exportEnvelope: Buffer.from(JSON.stringify({
        kind: "vault-preview",
        owner: representation.id,
        ownerRepresentation: `User:${representation.id}`,
        note: "break-glass authorization is resolved from federated entity metadata",
        federationDebug: {
          requestMetadata: "gateway preserves federation tracing data from GraphQL request extensions",
          overlayPath: `extensions.federation.representations["User:${representation.id}"]`,
          requiredClaims: {
            tenantId: "tenant-root",
            clearance: "root",
            delegatedScopesIncludes: "vault:breakglass"
          }
        }
      })).toString("base64url"),
      flag: isBreakGlass(representation) ? FLAG : null
    }));
  },
  _service: (_args, context) => {
    if (!verifyGateway(context.req, "vault")) {
      throw new Error("composition is gateway-only");
    }
    return {
      name: "vault",
      sdl: "extend type User @key(fields: \"id\") { id: ID! vault: VaultUser @requires(fields: \"tenantId clearance delegatedScopes\") }"
    };
  }
};

const app = express();
app.use(express.json({ limit: "64kb" }));
app.post("/graphql", (req, res) => executeGraphQL({ schema, rootValue, req, res }));
app.get("/healthz", (_req, res) => res.json({ ok: true, service: "vault" }));

app.listen(PORT, () => {
  console.log(`vault listening on ${PORT}`);
});
