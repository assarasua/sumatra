# Implementation notes

PAP explicitly permits stateless MCP/OpenAPI to ignore Session claims (section 7). The kit's issuerless guidance also discusses verified Sessions. This implementation uses the documented stateless guest option and advertises no joined Session functionality. Validation results must not be described as validating sign-in, Poppy Conversations or delegation.
