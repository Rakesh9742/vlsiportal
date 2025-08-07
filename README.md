# VLSI Portal

A comprehensive web application for VLSI students and teachers to manage queries and responses. Built with React.js, Node.js, and MySQL.

## Features

### For Students
- **Registration**: Create account with full name, domain, unique username, and password
- **Query Management**: Submit detailed queries with categories, priorities, design stages, and tools
- **Response Tracking**: View teacher responses and track query status
- **Profile Management**: Update personal information and domain

### For Teachers
- **Query Overview**: View all student queries with detailed information
- **Response System**: Provide detailed responses to student queries
- **Status Management**: Update query status (open, in progress, resolved, closed)
- **Tool Integration**: Support for various EDA tools and design stages

## Tech Stack

- **Frontend**: React.js with React Router
- **Backend**: Node.js with Express.js
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Styling**: CSS with modern gradients and responsive design

## Project Structure

```
vlsiportal/
├── backend/
│   ├── config/
│   │   ├── database.js
│   │   └── database.sql
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── queries.js
│   │   └── users.js
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── Login.js
│   │   │   │   ├── Register.js
│   │   │   │   └── Auth.css
│   │   │   ├── queries/
│   │   │   │   ├── QueryList.js
│   │   │   │   ├── CreateQuery.js
│   │   │   │   ├── QueryDetail.js
│   │   │   │   └── Queries.css
│   │   │   ├── Dashboard.js
│   │   │   ├── Dashboard.css
│   │   │   ├── Navbar.js
│   │   │   ├── Navbar.css
│   │   │   ├── Profile.js
│   │   │   └── Profile.css
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
├── package.json
└── README.md
```

## Database Schema

### Users Table
- `id` (Primary Key)
- `username` (Unique)
- `password` (Hashed)
- `role` (student/teacher)
- `full_name`
- `domain`
- `created_at`
- `updated_at`

### Design Stages Table
- `id` (Primary Key)
- `name`
- `description`
- `created_at`

### Issue Categories Table
- `id` (Primary Key)
- `name`
- `description`
- `created_at`

### Tools Table
- `id` (Primary Key)
- `name`
- `description`
- `created_at`

### Queries Table
- `id` (Primary Key)
- `student_id` (Foreign Key)
- `teacher_id` (Foreign Key)
- `title`
- `description`
- `category`
- `priority` (low/medium/high/urgent)
- `tool_id` (Foreign Key)
- `design_stage_id` (Foreign Key)
- `issue_category_id` (Foreign Key)
- `status` (open/in_progress/resolved/closed)
- `resolution_attempts`
- `debug_steps`
- `created_at`
- `updated_at`

### Responses Table
- `id` (Primary Key)
- `query_id` (Foreign Key)
- `teacher_id` (Foreign Key)
- `answer`
- `created_at`
- `updated_at`

## Setup Instructions

### 1. Database Setup

1. Install MySQL on your system
2. Create a new database:
```sql
CREATE DATABASE vlsi_portal;
```
3. Run the database schema:
```bash
mysql -u your_username -p vlsi_portal < backend/config/database.sql
```

### 2. Environment Configuration

Create `.env` file in the backend directory:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=vlsi_portal
DB_PORT=3306

JWT_SECRET=your_jwt_secret_key_here
PORT=5000
```

### 3. Installation

Install all dependencies:
```bash
npm run install-all
```

### 4. Start the Application

Development mode (both frontend and backend):
```bash
npm run dev
```

Or start separately:
```bash
# Backend only
npm run server

# Frontend only
npm run client
```

## Demo Credentials

### Teachers (Pre-inserted)
- **Username**: teacher1, **Password**: password
- **Username**: teacher2, **Password**: password

### Students
- Register new accounts through the registration form

## API Endpoints

### Authentication
- `POST /api/auth/register` - Student registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Queries
- `GET /api/queries/design-stages` - Get all design stages
- `GET /api/queries/issue-categories` - Get all issue categories
- `GET /api/queries/tools` - Get all tools
- `GET /api/queries` - Get all queries (role-based)
- `POST /api/queries` - Create new query (students only)
- `GET /api/queries/:id` - Get single query with responses
- `POST /api/queries/:id/responses` - Add response (teachers only)
- `PUT /api/queries/:id/status` - Update query status (teachers only)
- `PUT /api/queries/:id` - Update query (students only)

### Users
- `GET /api/users/teachers` - Get all teachers
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

## Key Features

### Modern UI/UX
- Responsive design with gradient themes
- Smooth animations and transitions
- Loading states and error handling
- Intuitive navigation

### Security
- JWT-based authentication
- Password hashing with bcryptjs
- Role-based access control
- Input validation and sanitization

### Database Design
- Normalized schema with proper relationships
- Foreign key constraints
- Timestamp tracking
- Efficient indexing

## Development Guidelines

### Code Organization
- Separate frontend and backend directories
- Modular component structure
- Consistent naming conventions
- Proper error handling

### Styling
- CSS modules for component-specific styles
- Responsive design principles
- Consistent color scheme and typography
- Modern gradient backgrounds

### Best Practices
- Input validation on both client and server
- Proper error messages and user feedback
- Loading states for better UX
- Secure authentication flow

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify MySQL is running
   - Check database credentials in `.env`
   - Ensure database exists

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill existing processes on port 5000

3. **CORS Issues**
   - Backend CORS is configured for development
   - Update CORS settings for production

4. **Authentication Issues**
   - Clear browser localStorage
   - Check JWT_SECRET in `.env`
   - Verify token expiration

### Performance Tips
- Use connection pooling for database
- Implement proper indexing
- Optimize React component rendering
- Use lazy loading for large datasets

## License

MIT License - feel free to use this project for educational purposes. 