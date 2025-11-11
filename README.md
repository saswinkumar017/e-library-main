# E-Library System

A comprehensive digital platform for managing academic resources, tracking book availability, and printing study materials with secure payment integration.

## Features

### User Features
- **Account Management**
  - Create account with Gmail ID
  - Secure authentication with JWT
  - Personal dashboard with statistics

- **E-Library Section**
  - Browse and search books by name, author, or genre
  - View book details (title, author, genre, publication year, ISBN)
  - Check availability status (Available/Issued)
  - See book location (Main library/Sub library)
  - Track borrower information and due dates
  - Borrow and return books

- **Printout Service**
  - Upload documents directly
  - Choose printing options:
    - Black & White (₹1 per page)
    - Color (₹3 per page)
  - Select number of copies (1-10)
  - GPay payment integration
  - Track printing history

### Admin Features
- **Dashboard Overview**
  - User statistics (total users, admin users, regular users)
  - Book statistics (total books, available copies, issued books, overdue books)
  - Printout statistics (total printouts, revenue)

- **User Management**
  - View all users with their statistics
  - Promote users to admin
  - Demote admin to regular user
  - Deactivate users

- **Book Management**
  - View all books with status
  - Create, update, and delete books
  - Track book circulation

- **Reporting**
  - Generate comprehensive reports:
    - User borrow history and printout spending
    - Book availability and circulation
    - Printout revenue and statistics

## Tech Stack

### Frontend
- React.js 18
- React Router v6
- Axios for API calls
- CSS3 for styling

### Backend
- Node.js with Express.js
- MongoDB for database
- JWT for authentication
- Bcrypt for password hashing
- Multer for file uploads

### Database
- MongoDB
- Mongoose ODM

## Project Structure

```
e-library-system/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── server/                # Node.js backend
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Authentication middleware
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── .gitignore
├── package.json           # Root package.json
└── README.md
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Setup Steps

1. **Clone the repository**
   ```bash
   cd /home/engine/project
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Configure environment variables**

   Create a `.env` file in the `server` directory:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/e-library
   JWT_SECRET=your_jwt_secret_key_here
   NODE_ENV=development
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

5. **Run the application**

   Option 1: Run both frontend and backend concurrently
   ```bash
   npm run dev
   ```

   Option 2: Run separately
   ```bash
   # Terminal 1 - Backend
   npm run server

   # Terminal 2 - Frontend
   npm run client
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google-login` - Google OAuth login
- `GET /api/auth/profile` - Get user profile

### Books
- `GET /api/books` - Get all books (with filters)
- `GET /api/books/:id` - Get book details
- `GET /api/books/:id/availability` - Check book availability
- `POST /api/books` - Create book (admin only)
- `PUT /api/books/:id` - Update book (admin only)
- `DELETE /api/books/:id` - Delete book (admin only)
- `POST /api/books/borrow` - Borrow a book
- `POST /api/books/return` - Return a book

### Printouts
- `POST /api/printouts` - Create printout request
- `POST /api/printouts/confirm-payment` - Confirm payment
- `GET /api/printouts/history` - Get user's printout history
- `GET /api/printouts/:id` - Get printout details
- `PUT /api/printouts/:printoutId/status` - Update status (admin only)
- `DELETE /api/printouts/:printoutId` - Cancel printout

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/stats` - Get user statistics
- `GET /api/admin/users/:userId/borrow-history` - Get user's borrow history
- `PUT /api/admin/users/:userId/promote` - Promote user to admin
- `PUT /api/admin/users/:userId/demote` - Demote admin to user
- `PUT /api/admin/users/:userId/deactivate` - Deactivate user
- `GET /api/admin/books` - Get all books
- `GET /api/admin/books/stats` - Get book statistics
- `GET /api/admin/printouts/stats` - Get printout statistics
- `GET /api/admin/reports` - Generate reports

## Usage

### For Regular Users

1. **Register/Login**
   - Create account with email or login with existing credentials

2. **Browse E-Library**
   - Use search functionality to find books
   - Filter by genre or location
   - View detailed book information

3. **Borrow Books**
   - Click "Borrow" button on any available book
   - Book will be added to your borrowed list with 14-day due date

4. **Print Documents**
   - Go to Printouts section
   - Upload document details
   - Choose color mode (BW or Color)
   - Select number of copies
   - Proceed to payment via GPay
   - Track printout status in history

### For Admins

1. **Access Admin Dashboard**
   - Click "Admin" link in navigation (only visible to admins)

2. **View Statistics**
   - Overview tab shows all key metrics
   - User, book, and printout statistics

3. **Manage Users**
   - View all users with their activity
   - Promote/demote admin privileges
   - Deactivate inactive users

4. **Track Books**
   - View all books in system
   - See availability and circulation status

5. **Generate Reports**
   - Download JSON reports for users, books, and printouts
   - Use for analysis and record-keeping

## Pricing

### Printing Service
- **Black & White:** ₹1 per page
- **Color:** ₹3 per page
- **Example:** 10 pages, 2 copies, Color = ₹60

### Book Borrowing
- **Duration:** 14 days
- **Late penalties:** As per institutional policy

## Data Models

### User
```javascript
{
  name, email, password, googleId,
  role: 'user' | 'admin',
  borrowedBooks: [],
  totalPrintoutSpent, totalPrintoutsCount,
  isActive, createdAt, updatedAt
}
```

### Book
```javascript
{
  title, author, genre, publicationYear, isbn,
  description, coverImage, location,
  totalCopies, availableCopies, issuedCopies: [],
  createdAt, updatedAt
}
```

### Printout
```javascript
{
  userId, userName, documentName, fileUrl,
  colorMode: 'BW' | 'Color',
  copies, totalPages, totalCost,
  paymentStatus: 'pending' | 'completed' | 'failed',
  paymentMethod: 'gpay' | 'credit_card' | 'debit_card',
  status: 'pending' | 'processing' | 'completed' | 'cancelled',
  transactionId, createdAt, completedAt
}
```

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Protected routes with middleware
- Admin-only operations validation
- Secure payment integration

## Future Enhancements

- Email notifications for due dates and payment confirmations
- Advanced analytics and reporting
- Mobile app version
- Integration with actual payment gateways (GPay, Razorpay)
- Book recommendations engine
- User reviews and ratings
- Reservation system for unavailable books
- Fine management system

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check MONGODB_URI in .env file
- Verify network connectivity

### Port Already in Use
- Change PORT in .env file
- Or kill existing process on port 5000/3000

### CORS Issues
- Check CORS configuration in server.js
- Ensure frontend and backend URLs match

## License

MIT License - feel free to use this project for educational and commercial purposes.

## Support

For issues, questions, or suggestions, please create an issue in the repository.

---

**Happy Learning! 📚**
