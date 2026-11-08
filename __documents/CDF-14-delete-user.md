CDF-14 — Delete a user account

This Jira task implements requirements defined in CDF-14 Story 4: Delete a user account. 

Builds on completed branches:
- CDF-7
- CDF-9
- CDF-13
- CDF-19

All application functionality remains the starter project taskmanager, to preserve existing links. These will be modified in later branches.

Updated the following files in this task:
1. userController.js - add deleteUser function
2. userRoutes.js - add deleteUser route
3. UserManagement.jsx - add delete user functionality in the Edit User card

Created the following in this task:
nil

CDF-19 Acceptance Criteria status. Test report version 3 records test results in detail. Summary of test results connected with CDF-13:
- TST022 - PASS
- TST023 - PASS
- TST024 - PASS

CHANGE LOG (to be added to Jira change log) as Change (8 next):
Decision: nil 

Design documentation changes:
- SysML bdd class diagram with new Admin operations

Reflection. nil.