process.env.GATEWAY_SECRET = process.env.GATEWAY_SECRET || "local-gateway-secret";
process.env.SESSION_SECRET = process.env.SESSION_SECRET || "local-session-secret";

process.env.PORT = process.env.ACCOUNTS_PORT || "3001";
require("./accounts");

process.env.PORT = process.env.VAULT_PORT || "3002";
require("./vault");

process.env.PORT = process.env.GATEWAY_PORT || "3000";
process.env.ACCOUNTS_URL = process.env.ACCOUNTS_URL || "http://localhost:3001/graphql";
process.env.VAULT_URL = process.env.VAULT_URL || "http://localhost:3002/graphql";
require("./gateway");
