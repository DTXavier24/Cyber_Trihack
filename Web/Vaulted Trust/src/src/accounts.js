const express = require("express");
const { buildSchema } = require("graphql");
const { executeGraphQL } = require("./lib/graphql-http");
const { hmac, timingSafeEqualHex } = require("./lib/crypto");

const PORT = Number(process.env.PORT || 3001);
const GATEWAY_SECRET = process.env.GATEWAY_SECRET || "dev-gateway-secret";

const users = new Map([
  ["u-guest", {
    id: "u-guest",
    handle: "guest",
    displayName: "Guest Analyst",
    tenantId: "tenant-community",
    plan: "community",
    supportPin: "STAGE1{metadata_is_only_a_pivot}",
    clearance: "basic"
  }],
  ["u-root", {
    id: "u-root",
    handle: "root-operator",
    displayName: "Root Operator",
    tenantId: "tenant-root",
    plan: "internal",
    supportPin: "disabled",
    clearance: "root"
  }]
]);

function verifyGateway(req, audience) {
  const body = JSON.stringify(req.body || {});
  const expected = hmac(GATEWAY_SECRET, `${audience}\n${body}`);
  return req.header("x-gateway-aud") === audience &&
    timingSafeEqualHex(req.header("x-gateway-signature"), expected);
}

const schema = buildSchema(`
  type Query {
    user(id: ID!): User
    _service: Service!
  }

  type Service {
    name: String!
    sdl: String!
  }

  type User {
    id: ID!
    handle: String!
    displayName: String!
    tenantId: String!
    plan: String!
    supportPin: String!
    clearance: String!
  }
`);

const rootValue = {
  user: ({ id }, context) => {
    if (!verifyGateway(context.req, "accounts")) {
      throw new Error("unsigned subgraph request");
    }
    return users.get(id) || null;
  },
  _service: (_args, context) => {
    if (!verifyGateway(context.req, "accounts")) {
      throw new Error("composition is gateway-only");
    }
    return {
      name: "accounts",
      sdl: "type User @key(fields: \"id\") { id: ID! handle: String! tenantId: String! clearance: String! }"
    };
  }
};

const app = express();
app.use(express.json({ limit: "64kb" }));
app.post("/graphql", (req, res) => executeGraphQL({ schema, rootValue, req, res }));
app.get("/healthz", (_req, res) => res.json({ ok: true, service: "accounts" }));

app.listen(PORT, () => {
  console.log(`accounts listening on ${PORT}`);
});
