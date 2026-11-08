CDF-13 — Enforce Member and Admin Permissions

This Jira task implements requirements defined in CDF-13 Story 2: Enforce Member and Admin permissions. This builds on the implemented code from branches CDF-7 and CDF-9. Admin-only reoute integration and verification will be completed as part of feature branch CDF-19 when Admin functionality is introduced.

All application functionality remains the starter project taskmanager, to preserve existing links. These will be modified in later branches.

Updated the following files in this task:
1. authMiddleware.js - added adminOnly to protect routes that are only available for Admins
2. .env - added one set of administrator credentials to ensure at least 1 valid Admin account exists in the local git-ignored .env file
3. .env.example - added example of admin credentials
4. README.md - modified to first draft of the CDF application readme file, and will be progressively updated as each feature branch is merged
5. server.js - modified to create an initial Admin account if not already in database

Created the following in this task:
6. createInitialAdmin.js - new file to create a valid Admin account if one does not exist in the database

CDF-13 Acceptance Criteria status. Test report version 2 records test results in detail. Summary of test results connected with CDF-13:
- TST013 - PASS
- TST014 - PASS
- TST015 - PASS
- TST016 - PASS
Server-side Admin-only route integration remains partially implemented and will be completed and tested in CDF-19

CHANGE LOG (to be added to Jira change log) as Change 7:
Decision: created Test plan and results document to record manual testing and verification of system function 

Design documentation changes:
- nil

Reflection. nil.