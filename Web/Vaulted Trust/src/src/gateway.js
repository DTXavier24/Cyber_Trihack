const express = require("express");
const { buildSchema, parse, visit } = require("graphql");
const { executeGraphQL } = require("./lib/graphql-http");
const { decodeSession, setSessionCookie } = require("./lib/session");
const { callSubgraph, deepMergeTrustedRepresentation } = require("./lib/subgraph-client");

const PORT = Number(process.env.PORT || 3000);
const ACCOUNTS_URL = process.env.ACCOUNTS_URL || "http://localhost:3001/graphql";
const VAULT_URL = process.env.VAULT_URL || "http://localhost:3002/graphql";
const GATEWAY_SECRET = process.env.GATEWAY_SECRET || "dev-gateway-secret";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-session-secret";

const ALLOWED_OPERATION_NAMES = new Set(["Login", "GetProfile", "PublicUser"]);

function assertGatewayPolicy(req, res, next) {
  const { query, operationName } = req.body || {};

  if (!ALLOWED_OPERATION_NAMES.has(operationName)) {
    res.status(403).json({ errors: [{ message: "operation is not registered" }] });
    return;
  }

  try {
    const ast = parse(query || "");
    let blocked = false;
    visit(ast, {
      Field(node) {
        if (node.name.value === "__schema" || node.name.value === "__type") {
          blocked = true;
        }
      }
    });
    if (blocked) {
      res.status(400).json({ errors: [{ message: "introspection is disabled" }] });
      return;
    }
  } catch (error) {
    res.status(400).json({ errors: [{ message: error.message }] });
    return;
  }

  next();
}

async function fetchUser(id) {
  const data = await callSubgraph(ACCOUNTS_URL, GATEWAY_SECRET, "accounts", {
    query: "query UserById($id: ID!) { user(id: $id) { id handle displayName tenantId plan supportPin clearance } }",
    variables: { id },
    operationName: "UserById"
  });
  return data.user;
}

async function fetchVaultForUser(user, context) {
  const key = `User:${user.id}`;
  const clientOverlay = context.extensions &&
    context.extensions.federation &&
    context.extensions.federation.representations &&
    context.extensions.federation.representations[key];

  const representation = deepMergeTrustedRepresentation({
    __typename: "User",
    id: user.id,
    tenantId: user.tenantId,
    clearance: user.clearance,
    delegatedScopes: []
  }, clientOverlay);

  const data = await callSubgraph(VAULT_URL, GATEWAY_SECRET, "vault", {
    query: "query ResolveVault($representations: String!) { _entities(representations: $representations) { id status exportEnvelope flag } }",
    variables: { representations: JSON.stringify([representation]) },
    operationName: "ResolveVault"
  });

  return data._entities[0];
}

const schema = buildSchema(`
  type Query {
    me: User
    user(id: ID!): User
  }

  type Mutation {
    login(username: String!, password: String!): User
  }

  type User {
    id: ID!
    handle: String!
    displayName: String!
    tenantId: String!
    plan: String!
    supportPin: String!
    vault: Vault!
  }

  type Vault {
    id: ID!
    status: String!
    exportEnvelope: String!
    flag: String
  }
`);

const rootValue = {
  login: async ({ username, password }, context) => {
    if (username !== "guest" || password !== "guest") {
      throw new Error("invalid credentials");
    }

    const user = await fetchUser("u-guest");
    setSessionCookie(context.res, SESSION_SECRET, user.id);
    return decorateUser(user, context);
  },
  me: async (_args, context) => {
    const session = decodeSession(SESSION_SECRET, context.req.header("cookie"));
    if (!session || !session.userId) {
      return null;
    }
    const user = await fetchUser(session.userId);
    return user ? decorateUser(user, context) : null;
  },
  user: async ({ id }, context) => {
    const user = await fetchUser(id);
    if (!user) {
      return null;
    }

    const publicUser = { ...user, supportPin: "redacted", clearance: "basic" };
    return decorateUser(publicUser, context);
  }
};

function decorateUser(user, context) {
  return {
    ...user,
    vault: () => fetchVaultForUser(user, context)
  };
}

const app = express();
app.get("/", (_req, res) => {
  res.type("text/plain").send([
    "TriHack Cloud GraphQL Gateway",
    "",
    "Endpoint: POST /graphql",
    "Content-Type: application/json",
    "",
    "Registered starter operations:",
    "",
    "Login:",
    "{\"operationName\":\"Login\",\"query\":\"mutation Login { login(username:\\\"guest\\\", password:\\\"guest\\\") { id handle plan } }\"}",
    "",
    "GetProfile:",
    "{\"operationName\":\"GetProfile\",\"query\":\"query GetProfile { me { id handle vault { status exportEnvelope } } }\"}",
    "",
    "PublicUser:",
    "{\"operationName\":\"PublicUser\",\"query\":\"query PublicUser { user(id:\\\"u-guest\\\") { id handle plan } }\"}"
  ].join("\n"));
});
app.use(express.json({ limit: "64kb" }));
app.post("/graphql", assertGatewayPolicy, (req, res) => executeGraphQL({ schema, rootValue, req, res }));
app.all("/graphql", (_req, res) => {
  res.status(405).json({ errors: [{ message: "GraphQL endpoint accepts POST JSON requests only" }] });
});
app.get("/healthz", (_req, res) => {
  res.json({
    ok: true,
    service: "gateway",
    registeredOperations: Array.from(ALLOWED_OPERATION_NAMES)
  });
});

app.listen(PORT, () => {
  console.log(`gateway listening on ${PORT}`);
});
