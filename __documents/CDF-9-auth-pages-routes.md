CDF-9 — Adapt Authentication Pages and Routes

This Jira task reuses, modifies and adds to the existing code base of the TaskManager starter project in relation the user authentication and authorisation requirements of the Community Discussion Forum project CDF.

Updated the following files in this task:
1. User.js - added role and _deleted fields, deleted address and university, normalised email
2. authcontroller.js - registration, login, get/update profile, change password
3. authRoutes.js - added routes for changePassword and commented public and protected routes
4. authMiddleware.js - modified to validate JWTs and confirm user accoutns are still active
5. AuthContext.js - modified to persist the user session using local storage
6. axiosConfig.jsx - modified to attach JWT automatically
7. login.jsx - modified to handle and display errors, authentication
8. register.jsx - modified to handle and display errors, add success message, cannot set role
9. profile.jsx - modified to allow user to update their profile, change password, view role as read-only, and remove the university and address fields
11. App.js - updated to create handling for public, protected and unknown urls. Protected routes enforce authenticated user. Insert Footer
12. index.css - modified to create consistent style sheet based on Figma lo-fi mockup
13. navbar.jsx - modified based on the navbar header mocked up in Figma lo-fi

Created the following in this task:
14. /components/ProtectedRoute.jsx - new file to check for a user session and valid token, otherwise direct to login. Backend authentication independantly validates the JWT and that account remains active
15. /components/Footer.jsx - new file to introduce a standard footer for all webpages

All application functionality remains the starter project taskmanager, to preserve existing links. These will be modified in later branches.

CDF-7 Acceptance Criteria status. Tested CDF-9 changes in development mode verified the following:
- A new user can register and sign in. VERIFIED
- An existing user can sign in and the system starts their session. VERIFIED
- An existing user can update their account name, email and password. VERIFIED
- An Admin can update any user account. NOT DONE: Move to task branch CDF-14
- A deleted user receives an understandable alert. PARTIAL: Move to task branch CDF-14
- Required fields are validated, and invalid submissions show understandable errors. PARTIAL: Move to task branch CDF-10
- Passwords are stored using the starter project’s secure authentication approach. VERIFIED
- Unauthenticated users cannot access forum content. VERIFIED
- A user can sign-out and the system terminates their session. VERIFIED

CHANGE LOG (to be added to Jira change log) as Change 6:
Scope change. Reviewing criteria "An Admin can update any user account" has exposed that there are no Jira stories related to user account management, although there is an explicit funtional requirement FR007. This has exposed a gap in the Jira stories. DECISION: CDF-19 Story 3: Promote a Member to Admin will be amended to User Management to include promoting and changing user profiles.
Design documentation changes:
- SysML class diagram to be amended to reflect operations in User class

Figma will not be updated to reflect detailed design implementation as it reflected a starting baseline for development

Reflection. Reviewing the progress and approach of using Jira sub-tasks as the work package for a GitHub branch, I have realised this is too granualar for managing code development. In completing a sub-task scope, I have naturally completed activities related to other sub-tasks. On reflection, I will instead start to issue Github branches at the Jira Story level and use the sub-tasks as an additional verification check for each branch. This work package will be committed to the feature branch and merged into main via pull request. The next development branch will be for CDF-7 (Story 1), encompassing CDF-10, CDF-11 and unfinished aspects of CDF-9.