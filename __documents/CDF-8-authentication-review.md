CDF-8 — Review Starter Project Authentication

This Jira task reviews the existing code and architecture of the TaskManager starter project in relation the user authentication and authorisation requirements of the Community Discussion Forum project CDF. It then identifies the abilty to reuse, modify or replace existing code to meet the CDF requirements.

Existing Architecture. The starter project uses the following technologies and components:
- Frontend: React
- Backend: Node.js and Express
- Database: MongoDB with Mongoose
- Authentication: JSON Web Tokens (JWT)
- Password security: bcrypt password hashing

The existing implementation separates authentication responsibilities across models, controllers, routes, and middleware.

The starter project already provides:
- User registration.
- Password hashing using bcrypt.
- User login with password verification.
- JWT generation following successful registration or login.
- JWT verification through authentication middleware.
- Protected profile retrieval and update endpoints.
- React authentication context for maintaining user state.

The following limitations were identified in the starter project review when reviewing against functional requirements FR001-FR011 and NFR001-NFR006:
- User roles. The user schema does not currently define Member or Admin roles.
- Registration. Input validation and email normalisation are limited.
- Authorisation. There is no dedicated Admin-only authorisation middleware.
- Account status. The user schema does not currently include an account deletion or disabled-account status field.
- Frontend persistence. Authentication context does not persist the user session across a browser refresh. 
- Registration experience. The registration page does not automatically establish the authenticated session using the returned token.

The design approach will:
1. Reuse the existing Mongoose User model and extend it to support the required role and account-status information.
2. Reuse the existing registration and login controllers, improving validation and response handling where required.
3. Retain JWT-based authentication.
4. Improve authentication middleware to handle missing users and account status correctly.
5. Introduce role-based authorisation middleware for Admin-only operations.
6. Extend the React authentication context and interfaces to support the required authentication and role behaviour.

Changes will be made in the relevant feature branches and linked to their Jira issues.

This review establishes the baseline for the subsequent authentication and permissions implementation tasks.