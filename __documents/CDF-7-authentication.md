CDF-7 — Authentication

This Jira task implements all authentication requirements defined in Story 1 - Authentication. THis is the first GitHub feature branch developed at the story level, so it builds on the changes already integrated in bfeature branch CDF-9.

Updated the following files in this task:
1. User.js - trim the name to strengthen security
2. authController.js - modified to include more comprehensive blank input, error checking and error handling
3. Login.jsx - added logic to display input error messages (fix test failure from CDF-9)
4. Profile.jsx - added logic to display input error messages (fix test failure from CDF-9)
5. Register.jsx - added logic to display input error messages (fix test failure from CDF-9)


Created the following in this task:
14. nil

All application functionality remains the starter project taskmanager, to preserve existing links. These will be modified in later branches.

CDF-7 Acceptance Criteria status. Test report version 1 records test results in detai. Summary of test results connected with CDF-7:
- TST001 - PASS
- TST002 - retested and PASS
- TST003 - PASS
- TST004 - retested and PASS
- TST005 - NOT TESTED. To be tested in feature/CDF-14
- TST006 - PASS
- TST007 - PASS
- TST008 - PASS
- TST009 - PASS
- TST010 - retested and PASS
- TST011 - PASS
- TST012 - PASS

CHANGE LOG (to be added to Jira change log) as Change 7:
Decision: created Test plan and results document to record manual testing and verification of system function 

Design documentation changes:
- nil

Reflection. nil.