const { graphql } = require("graphql");

async function executeGraphQL({ schema, rootValue, req, res, contextValue }) {
  if (!req.is("application/json")) {
    res.status(415).json({ errors: [{ message: "JSON GraphQL requests only" }] });
    return;
  }

  const { query, variables, operationName, extensions } = req.body || {};
  if (typeof query !== "string") {
    res.status(400).json({ errors: [{ message: "Missing GraphQL query" }] });
    return;
  }

  const result = await graphql({
    schema,
    source: query,
    rootValue,
    variableValues: variables,
    operationName,
    contextValue: {
      req,
      res,
      extensions: extensions || {},
      ...(contextValue || {})
    }
  });

  res.status(result.errors ? 400 : 200).json(result);
}

module.exports = { executeGraphQL };
