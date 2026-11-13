# IFQ636 Assignment 1 Submission

**Contents:**
1. Exceptions to Assignment Requirements
2. Application Overview
3. Pre-requisites
4. Application Deployment Instructions

## 1. Exceptions to Assignment Requirements

- The EC2 instance is deployed in a public subnet with an active Internet Gateway route.<br>
- The university-provided Security Group currently restricts inbound HTTP access on TCP port 80 to approved IP addresses.<br>
- Attempts to configure unrestricted public HTTP access using 0.0.0.0/0 have not resulted in a persistent rule. The student AWS IAM role also does not currently permit the creation of additional Security Groups.<br>
- A request has been submitted to the university for persistent public HTTP access.<br>

- Consequently, access from networks outside the approved IP addresses may be unavailable until the restriction is resolved.<br>
- The application URL must therefore be tested from the network permitted by the current Security Group configuration.<br>
- The EC2 instance does not have an Elastic IP. Its public IPv4 address may change whenever the instance is stopped and restarted. Always retrieve the current address from the EC2 Console before accessing the application.<br>
- The university AWS environment may automatically stop the instance at midnight. If the instance stops during the assessment period, repeat the startup procedure and retrieve the new public IP address.<br>

---

## 2. Application Overview

**Community Discussion Forum (CDF) Application Overview:**
This application has been developed for IFQ636 Assignment 1. The CDF application is designed to demonstrate a forum discussion board for a generic community group by providing a user-friendly interface for creating, viewing, updating, moderating and deleting forum topics and replies.

The CDF is a basic discussion forum. There are two permitted roles: **Members** that are the default role when a user registers, and **Admin** responsible for CDF user management and content moderation.

**Content** The CDF has two types of content: **Topic** that contains a title and description, and **Reply**. A topic can have multiple replies linked to it. Any valid user can create, update and delete their own content. Any valid user can view and search visible content with a simple text string search.

**Content moderation** The CDF has a simple moderation service where any valid user can **Report** a content item as inappropriate. This will create a user unique report that any Admin can review. Users will need to provide a reason why they believe the content is inappropriate. An Admin can review open reports, and decide to hide or delete inappropriate content, reject the request and keep content visible. If a Topic is hidden as a result of a moderation decision, then all linked replies will also be hidden automatically.

**User Management** The CDF has basic user management services. A Member can view and update their own name, email and password. An Admin can update any user account, promote a Member to Admin, and delete a user account. If a user has been deleted, they will receive a specific error message the next time they log in.

**Content management** An Admin can view all, visible or hidden content. An Admin can change content to hide/visible, and delete any content. If a Topic is selected to be unhidden, all linked replies will also be unhidden, regardless of their prior visibility status. Deletion will permanently delete the content item, any reports linked to the item, and if the item is a Topic, all linked replies and their reports (if any).

**Account creation** Public registration always creates a Member account. One Admin account is created when the backend starts using credentials stored in /backend/.env. This only happens if a valid Admin account **does not** exist in the database.

The CDF includes essential features such as secure user authentication, role-based authorisation, input field validation and email validation, and error handling.

This application is built on the start app provided by QUT.

---

## 3. Pre-requisites

### 3.1 Development Environment
To install, configure and run the application locally, the following software and accounts are required:<br>
•	Node.js: https://nodejs.org/en <br>
•	Git: https://git-scm.com/<br>
•	Visual Studio Code: https://code.visualstudio.com/<br>
•	MongoDB account: https://account.mongodb.com/account/login<br>
•	GitHub account: https://github.com/signup<br>
MongoDB Atlas is used to host the application's database.

### 3.2 Production Environment
The production application is deployed on an AWS EC2 instance.
The production environment uses:<br>
- Operating system: Ubuntu<br>
- Frontend: React production build<br>
- Backend: Node.js and Express<br>
- Database: MongoDB Atlas<br>
- Web server: Nginx<br>
- Process management: PM2<br>
- Application access: HTTP through Nginx<br>

The application is configured to run on the EC2 instance without requiring the assessor to install the development software listed in Section 3.1.

---

## 4. Application Deployment Instructions

### 4.1 Deployment Overview
The Community Discussion Forum is deployed on an AWS EC2 instance in the ap-southeast-2 (Sydney) region.
The production application uses the following architecture:<br>
•	The React frontend is built for production and served through PM2 on port 3000.<br>
•	The Node.js/Express backend is managed by PM2 and runs on port 5001.<br>
•	Nginx listens on port 80 and acts as a reverse proxy for the frontend and backend.<br>
•	MongoDB Atlas hosts the application database.<br>
The frontend and backend application ports are not intended to be accessed directly from the internet. External browser requests are routed through Nginx.

### 4.2 AWS Infrastructure
The production environment uses the following AWS configuration:<br>
- AWS region: ap-southeast-2<br>
- EC2 Instance ID: i-0ba098c45733fb7ff  | name: GS-CDF<br>
- Instance type: t3.medium<br>
- Operating system: Ubuntu 26.04.1 LTS<br>
- VPC ID: vpc-07584b1ef8bcee90<br>
- Subnet ID: subnet-05737ebd8bdd22c3f<br>
- Security Group: student-allowed-sg-3<br>
- Security Group ID: sg-0d93e9e10bc2d53d1<br>

The EC2 instance is deployed in a public subnet. Its route table contains an active default route (0.0.0.0/0) through an Internet Gateway.

### 4.3 Starting the EC2 Instance
The university AWS environment may automatically stop the EC2 instance at midnight. If the instance is stopped, it must be started again before the application can be accessed.
To start the application environment:
1.	Sign in to the AWS Management Console.
2.	Navigate to EC2 → Instances.
3.	Locate the Community Discussion Forum instance using the EC2 Instance ID supplied with the assignment.
4.	Select the instance.
5.	If the instance state is Stopped, select Instance state → Start instance.
6.	Wait until the instance state is Running.
7.	Confirm that both EC2 status checks have passed.

### 4.4 Retrieve the Current Public IP Address
The EC2 instance uses a dynamic public IPv4 address rather than an Elastic IP address.
The public IP address may change whenever the instance is stopped and restarted.
After starting the instance:
1.	Select the EC2 instance in the AWS Console.
2.	Locate the Public IPv4 address in the instance details.
3.	Record the current address.

The application URL is:
`http://<CURRENT_PUBLIC_IPV4_ADDRESS>`
For example: http://3.106.255.198
The example address is provided for illustration. Always retrieve the current address from the AWS Console before accessing the application.

### 4.5 Application Startup
The production environment is configured to start automatically when the EC2 instance starts.
The following services are configured for automatic startup:<br>
•	Nginx: Provides the web server and reverse proxy.<br>
•	PM2 systemd service: Restores the saved PM2 process configuration.<br>
•	cdf-backend: Runs the Node.js/Express backend.<br>
•	cdf-frontend: Serves the React production build.<br>

PM2 restores the application processes using the saved process configuration.
The backend connects to MongoDB Atlas and checks whether an active Admin account exists. If no active Admin account exists, the initial Admin account is created using the credentials configured in the server-side environment file.
Existing Member accounts, Topics, Replies and Reports are retained in MongoDB Atlas. Restarting the EC2 instance does not require the database to be recreated or populated again.

### 4.6 Deploying Application Updates

The production application can be updated manually when a new version is available in the GitHub repository.

The deployment script `scripts/deploy-production.sh` automates the production update process. It:

1. Retrieves the latest code from the `main` branch.
2. Installs backend and frontend dependencies using `npm ci`.
3. Builds the React frontend production application.
4. Restarts the backend and frontend processes using PM2.
5. Saves the PM2 process configuration.
6. Runs the production verification script.

To deploy an application update, connect to the EC2 instance through SSH and execute:

```bash
cd ~/GS-CDF/CommunityDiscussionForum
./scripts/deploy-production.sh
```

The deployment script requires the repository to be on the `main` branch and the production environment configuration to be present.

The application also includes `scripts/check-production.sh`, which can be executed independently to verify the production services and application responses: <br>
```./scripts/check-production.sh```

The deployment script is intended for new application releases. It is not required when restarting an EC2 instance because the PM2 systemd service automatically restores the saved application processes.

### 4.7 Application Verification
After starting the EC2 instance, an administrator can connect to the instance through SSH to verify the production environment.
Check Nginx: `sudo systemctl status nginx --no-pager`
Check the PM2 startup service: `sudo systemctl status pm2-ubuntu --no-pager`
Check the application processes: `pm2 status`

The expected PM2 processes are:<br>
•	cdf-backend — online.<br>
•	cdf-frontend — online.<br>

Inspect recent backend logs: `pm2 logs cdf-backend --lines 30 --nostream`

Run the production verification script: `./scripts/check-production.sh`

The verification script checks Nginx, the PM2 startup service, application process status and frontend/backend responses.

### 4.8 Security Configuration and Environment Variables
Production environment variables are configured on the EC2 instance in: **backend/.env**
This file contains sensitive database connection and authentication configuration.
Security measures include:<br>
•	The .env file is excluded from Git through .gitignore.<br>
•	Production environment variables are not committed to the GitHub repository.<br>
•	The server-side .env file has restricted file permissions.<br>
•	The repository contains an example environment configuration without production secrets.<br>
•	SSH access is restricted to an authorised IP address.<br>
•	Frontend and backend application ports 3000 and 5001 are not directly exposed to the internet.<br>

### 4.9 Project References
GitHub repository: https://github.com/gary-stewart-4068/CommunityDiscussionForum
Jira project: https://dzqzwj.atlassian.net/jira/software/projects/CDF/summary
AWS EC2 Instance ID: i-0ba098c45733fb7ff  | name: GS-CDF

---
