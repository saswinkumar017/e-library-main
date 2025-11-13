# E-Library System

## Overview
The E-Library System is an integrated web platform that streamlines access to academic resources, document printing, and administrative oversight. It combines a React-based client with a Node.js/Express backend and MongoDB persistence to deliver a secure experience for students, librarians, and institutional administrators.

## Feature Highlights
### Regular Members
- Self-service registration and secure authentication with JWT
- Personal dashboard with borrowing, printout, and spending insights
- Advanced search across title, author, genre, and location
- Real-time visibility into availability, borrower status, and due dates
- End-to-end management of borrowing and returns
- Online submission and tracking of printout requests, including payment confirmation

### Administrators
- Role-based access to an administrative dashboard
- Consolidated statistics for users, inventory, and revenue
- End-user directory with engagement metrics and account controls
- Full book catalogue management with create, update, and delete capabilities
- Printout monitoring and status management
- Automated generation of JSON reports for users, books, and printouts

### Super Administrator
- Dedicated control centre with system-wide metrics
- Promotion, demotion, activation, and reactivation of user accounts
- Segmented views for regular members and administrator cohorts
- Export tooling for policy, audit, and compliance reporting

## Technology Stack
- **Frontend:** React 18, React Router v6, Axios, modular CSS
- **Backend:** Node.js, Express.js, JWT, bcrypt, Multer for uploads
- **Database:** MongoDB with Mongoose ODM
- **Build Tooling:** npm workspaces with dedicated client and server packages

## System Architecture
```
e-library-system/
├── client/                 # React application
│   ├── public/
│   ├── src/
│   │   ├── components/    # Layout, navigation, shared UI elements
│   │   ├── pages/         # Route-level views for each role
│   │   ├── services/      # API integrations
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── server/                # Express API
│   ├── controllers/       # Route handlers
│   ├── middleware/        # Authentication and authorization logic
│   ├── models/            # Mongoose schemas
│   ├── routes/            # REST endpoints
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── package.json           # Root workspace configuration
├── package-lock.json
└── README.md
```

## Getting Started
### Prerequisites
- Node.js 16 or higher
- npm 8 or higher
- Local or hosted MongoDB instance

### Installation
```bash
git clone <repository-url>
cd e-library-system
npm run install-all
```

## Configuration
Create a `.env` file in the `server` directory using the following template:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/e-library
JWT_SECRET=<secure-random-string>
NODE_ENV=development
```

## Running the Application
**Option 1: Unified development experience**
```bash
npm run dev
```

**Option 2: Run services separately**
```bash
# Backend
env $(cat server/.env | xargs) npm run --prefix server dev

# Frontend
npm run --prefix client start
```

Frontend is available at `http://localhost:3000` and the REST API at `http://localhost:5000/api`.

## Key Workflows
### Regular Members
1. Register or authenticate via the login interface.
2. Browse titles, review metadata, and initiate borrowing.
3. Submit printout requests with preferred colour mode and copies.
4. Track outstanding loans, printout status, and spending in the dashboard.

### Administrators
1. Sign in and navigate to the administrator dashboard.
2. Review summary analytics for user activity, book inventory, and print orders.
3. Manage user accounts, deactivate inactive profiles, and maintain catalogues.
4. Produce structured reports for audit and operational review.

### Super Administrator
1. Access the super administrator suite via role-restricted navigation.
2. Monitor overall system health, user segmentation, and revenue trends.
3. Promote or demote accounts, and reactivate users as required.
4. Export comprehensive datasets to support governance and compliance.

## API Summary
All endpoints are namespaced under `/api`.

### Authentication
- `POST /auth/register` – Register a new member
- `POST /auth/login` – Authenticate an existing user
- `POST /auth/google-login` – Google OAuth login
- `GET /auth/profile` – Retrieve the authenticated user profile

### Books
- `GET /books` – List titles with available filters
- `GET /books/:id` – Retrieve detailed book metadata
- `POST /books` – Create a book (administrator only)
- `PUT /books/:id` – Update a book (administrator only)
- `DELETE /books/:id` – Remove a book (administrator only)
- `POST /books/borrow` – Borrow a title
- `POST /books/return` – Return a title

### Printouts
- `POST /printouts` – Submit a printout request
- `POST /printouts/confirm-payment` – Confirm payment completion
- `GET /printouts/history` – Retrieve member printout history
- `GET /printouts/:id` – Retrieve printout details
- `PUT /printouts/:printoutId/status` – Update printout status (administrator only)
- `DELETE /printouts/:printoutId` – Cancel a printout request

### Administration
- `GET /admin/users` – Retrieve all users with summary metrics
- `GET /admin/users/stats` – User statistics for dashboards
- `GET /admin/users/:userId/borrow-history` – Borrowing activity
- `PUT /admin/users/:userId/promote` – Promote to administrator (super administrator only)
- `PUT /admin/users/:userId/demote` – Revoke administrator privileges (super administrator only)
- `PUT /admin/users/:userId/deactivate` – Deactivate a user (super administrator only)
- `PUT /admin/users/:userId/reactivate` – Reactivate a user (super administrator only)
- `GET /admin/books` – Retrieve the managed catalogue
- `GET /admin/books/stats` – Book availability metrics
- `GET /admin/printouts/stats` – Printout statistics
- `GET /admin/reports` – Generate structured JSON reports

## Data Models
### User
```javascript
{
  name,
  email,
  password,
  googleId,
  role: 'user' | 'admin' | 'superadmin',
  borrowedBooks: [],
  totalPrintoutSpent,
  totalPrintoutsCount,
  isActive,
  createdAt,
  updatedAt
}
```

### Book
```javascript
{
  title,
  author,
  genre,
  publicationYear,
  isbn,
  description,
  coverImage,
  location,
  totalCopies,
  availableCopies,
  issuedCopies: [],
  createdAt,
  updatedAt
}
```

### Printout
```javascript
{
  userId,
  userName,
  documentName,
  fileUrl,
  colorMode: 'BW' | 'Color',
  copies,
  totalPages,
  totalCost,
  paymentStatus: 'pending' | 'completed' | 'failed',
  paymentMethod: 'gpay' | 'credit_card' | 'debit_card',
  status: 'pending' | 'processing' | 'completed' | 'cancelled',
  transactionId,
  createdAt,
  completedAt
}
```

## Security and Compliance
- Passwords are hashed with bcrypt.
- JWT-based session handling secures API access.
- Role-aware middleware protects administrative operations.
- File uploads are processed with Multer and stored securely.

## Roadmap
- Email notifications for due dates and payment confirmation
- Enhanced analytics and visual reporting
- Mobile-first experience
- Native integration with third-party payment gateways
- Recommendation engine, user reviews, and reservations
- Automated fine calculation and settlement

## Troubleshooting
### MongoDB Connectivity
- Verify that MongoDB is running and accessible.
- Confirm the `MONGODB_URI` value in the `.env` file.
- Ensure network permissions allow database access.

### Port Conflicts
- Change the `PORT` value or release the conflicting process.

### Cross-Origin Requests
- Confirm that the frontend and backend origin values match.
- Review the CORS configuration in `server/server.js`.

## License and Support
Distributed under the MIT License. For product questions or bug reports, open an issue in the repository.
