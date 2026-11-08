***WARNING - THIS IS UNDER DEVELOPMENT AND THIS README WILL BE PROGRESSIVELY UPDATED AS FEATURES ARE IMPLEMENTED***

**Community Discussion Forum (CDF) Application Overview:**
This application has been developed for IFQ636 Assignment 1. The CDF application is designed to demonstrate a forum discussion board for a generic community group by providing a user-friendly interface for creating, viewing, updating, moderating and deleting forum topics and replies.

The CDF is a basic discussion forum. There are two permitted roles: **Members** that are the default role when a user registers, and **Admin** responsible for CDF user management and content moderation.

**Content** The CDF has two types of content: **Topic** that contains a title and description, and **Reply**. A topic can have multiple replies linked to it. Any valid user can create, update and delete their own content. Any valid user can view and search visible content with a simple text string search.

**Content moderation** The CDF has a simple moderation service where any valid user can **Report** a content item as inappropriate. This will create a user unique report that any Admin can review. Users will need to provide a reason why they believe the content is inappropriate. An Admin can review open reports, and decide to hide or delete inappropriate content, reject the request and keep content visible.

**User Management** The CDF has basic user management services. A Member can view and update their own name, email and password. An Admin can update any user account, promote a Member to Admin, and delete a user account. If a user has been deleted, they will receive a specific error message the next time they log in.

**Content management** An Admin can view all, visible or hidden content. An Admin can change content to hide/visible, and delete any content.

**Account creation** Public registration always creates a Member account. One Admin account is created when the backend starts using credentials stored in /backend/.env. This only happens if a valid Admin account **does not** exist in the database.

Hiding or deleting a Topic will make the same change to its linked replies and reports.

The CDF includes essential features such as secure user authentication, role-based authorisation, input field validation and email validation, and error handling.

This application is built on the start app provided by QUT.
---

**Prerequisite:** Please install the following software and create accounts for the following web tools** **

* **Nodejs [**[https://nodejs.org/en](https://nodejs.org/en)]** **
* **Git [**[https://git-scm.com/](https://git-scm.com/)]** **
* **VS code editor** [[https://code.visualstudio.com/](https://code.visualstudio.com/)]** **
* **MongoDB Account** [[https://account.mongodb.com/account/login](https://account.mongodb.com/account/login)]** - In tutorial, we have also showed how can you create account and database: follow step number 2.**
* **GitHub Account** [[https://github.com/signup?source=login](https://github.com/signup?source=login)]** **

---

**Environment setup** {{text to be developed}}