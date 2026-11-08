CDF-19 — User Management

This Jira task implements requirements defined in CDF-19 Story 3: User Management. This also verifies Admin-only route integration and verification.

Builds on completed branches:
- CDF-7
- CDF-9
- CDF-13

All application functionality remains the starter project taskmanager, to preserve existing links. These will be modified in later branches.

Updated the following files in this task:
1. server.js - modified to introduce /API/users for user management functionality by Admins 
2. ProtectedRoute.js - modified to secure Admin only routes
3. App.js - modified to introduce UserManagement protected route for adminOnly

Created the following in this task:
6. userController.js - new file to introduce user management functions except for delete user
7. userRoutes.js - new file to introduce authentication and Admin authorisation for user management routes
8. UserManagement.jsx - new page for admin only user management functions (excluding delete user, to be added in CDF-14)

CDF-19 Acceptance Criteria status. Test report version 3 records test results in detail. Summary of test results connected with CDF-13:
- TST017 - PASS
- TST018 - PASS
- TST019 - PASS
- TST020 - PASS
- TST021 - PASS

Server-side Admin-only route integration remains partially implemented and will be completed and tested in CDF-19

CHANGE LOG (to be added to Jira change log) as Change (8 next):
Decision: nil 

Design documentation changes:
- SysML bdd class diagram with new Admin operations

Reflection. nil.