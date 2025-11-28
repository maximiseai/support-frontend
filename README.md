# Enrich Support Dashboard

A Next.js-based internal support dashboard for managing Enrich teams, credits, rate limits, and Sales Navigator accounts.

## Features

- **Team Management**: Search teams by member email, team name, or team ID
- **Credits Management**: Add credits to teams with optional notes
- **Rate Limits**: Update API rate limits for specific teams
- **Sales Nav Accounts**: View and toggle active status of Sales Navigator accounts
- **Authentication**: Secure OTP-based login using the same User model as the main API (users with `has_support_dashboard_access: true` only)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom warm color palette
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with OTP verification
- **HTTP Client**: Axios
- **Models**: Shared User and OTP models compatible with main API server

## Design

The dashboard features a minimal, elegant design with warm tones:

- Background: `#faf8f5` (warm beige)
- Text: `#3e3832` (dark brown)
- Accent: `#8b7355` (warm brown)
- Muted: `#a8998a` (muted brown)
- Border: `#e5dfd8` (light warm border)

No bright colors or gradients are used, maintaining a professional and calming aesthetic.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB instance with the Enrich database
- Access to the MongoDB credentials

### Installation

1. Clone the repository and navigate to the support-frontend directory:

```bash
cd support-frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

4. Update the `.env` file with your credentials:

```env
# MongoDB Configuration
MONGODB_URI=your-mongodb-uri
MONGODB_DB_NAME=enrich

# JWT Authentication
# IMPORTANT: Use the SAME JWT_SECRET as your main API server
JWT_SECRET=your-jwt-secret-from-main-api
```

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Authentication

The support dashboard uses **OTP-based authentication** with the same User model as the main Enrich API:

1. Only users with `has_support_dashboard_access: true` in the `users` collection can access the support dashboard
2. Users must exist in the database (same as main API users)
3. OTP is sent via email (currently logs to console - configure email service in production)
4. JWT tokens are signed with the same `JWT_SECRET` as the main API for consistency

**Granting Access**: To give a user access to the support dashboard, update their user document in MongoDB:
```javascript
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { has_support_dashboard_access: true } }
)
```

## Project Structure

```
support-frontend/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── otp/route.ts            # OTP request endpoint
│   │   │   ├── login/route.ts          # OTP verification & login
│   │   │   ├── logout/route.ts         # Logout endpoint
│   │   │   └── session/route.ts        # Session check endpoint
│   │   ├── credits/
│   │   │   └── add/route.ts            # Add credits API
│   │   ├── rate-limits/
│   │   │   └── update/route.ts         # Update rate limits API
│   │   ├── sales-nav-accounts/
│   │   │   ├── list/route.ts           # List accounts API
│   │   │   └── toggle/route.ts         # Toggle account status API
│   │   └── teams/
│   │       └── search/route.ts         # Team search API
│   ├── components/
│   │   └── Navigation.tsx              # Navigation component with logout
│   ├── credits/
│   │   └── page.tsx                    # Credits management page
│   ├── login/
│   │   └── page.tsx                    # OTP-based login page
│   ├── rate-limits/
│   │   └── page.tsx                    # Rate limits page
│   ├── sales-nav-accounts/
│   │   └── page.tsx                    # Sales Nav accounts page
│   ├── teams/
│   │   └── page.tsx                    # Team search page
│   ├── globals.css                     # Global styles with color palette
│   ├── layout.tsx                      # Root layout
│   └── page.tsx                        # Dashboard home page
├── lib/
│   ├── models/
│   │   ├── user.model.ts               # User model (same schema as main API)
│   │   └── otp.model.ts                # OTP model for authentication
│   └── mongodb.ts                      # MongoDB & Mongoose connections
├── middleware.ts                       # Authentication middleware
├── .env.example                        # Environment variables template
├── next.config.js                      # Next.js configuration
├── package.json                        # Project dependencies
├── tailwind.config.ts                  # Tailwind configuration
└── tsconfig.json                       # TypeScript configuration
```

## Usage

### Login

1. Navigate to `/login`
2. Enter your email address
3. Click "Send Login Code"
4. Check your email (or console in development) for the 6-digit OTP
5. Enter the OTP code
6. Click "Verify & Sign In"

**Note**: Only users with `has_support_dashboard_access: true` in the database can access the dashboard.

### Team Search

1. Navigate to `/teams`
2. Select search type (Email, Team Name, or Team ID)
3. Enter search query
4. View team details including members and credits

### Add Credits

1. Navigate to `/credits`
2. Search for a team
3. Select the team if multiple results
4. Enter credit amount to add
5. Optionally add a note
6. Click "Add Credits"

### Update Rate Limits

1. Navigate to `/rate-limits`
2. Search for a team
3. Select an API from the dropdown (or enter custom API name)
4. Enter the new rate limit value
5. Click "Update Rate Limit"

### Toggle Sales Nav Accounts

1. Navigate to `/sales-nav-accounts`
2. View list of all Sales Navigator accounts
3. Filter by All, Active, or Inactive
4. Click "Enable" or "Disable" to toggle account status

### Logout

Click the "Logout" button in the top right corner of the navigation bar.

## API Endpoints

### Authentication

- `POST /api/auth/otp` - Request OTP for admin user
  ```json
  {
    "email": "admin@example.com"
  }
  ```
- `POST /api/auth/login` - Verify OTP and login
  ```json
  {
    "email": "admin@example.com",
    "otp": "123456"
  }
  ```
- `POST /api/auth/logout` - Logout current session
- `GET /api/auth/session` - Check session status

### Teams

- `GET /api/teams/search?q={query}&type={email|name|id}` - Search teams

### Credits

- `POST /api/credits/add` - Add credits to a team
  ```json
  {
    "teamId": "string",
    "amount": number,
    "note": "string (optional)"
  }
  ```

### Rate Limits

- `POST /api/rate-limits/update` - Update team rate limit
  ```json
  {
    "teamId": "string",
    "apiName": "string",
    "limit": number
  }
  ```

### Sales Nav Accounts

- `GET /api/sales-nav-accounts/list` - List all accounts
- `POST /api/sales-nav-accounts/toggle` - Toggle account status
  ```json
  {
    "accountIndex": number,
    "active": boolean
  }
  ```

## Security

- All routes except `/login` are protected by authentication middleware
- Only users with `has_support_dashboard_access: true` can access the support dashboard
- JWT tokens are stored in HTTP-only cookies
- OTP codes expire after 5 minutes
- JWT tokens are signed with the same secret as the main API server
- All sensitive data is stored in environment variables
- In production, configure email service for OTP delivery (currently logs to console)
- Access control is granular - you can enable/disable support access for individual users

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## MongoDB Collections Used

- `users` - User authentication data (same as main API)
- `otps` - One-time passwords for authentication
- `teams` - Team data with credits and API limits (same as main API)
- `sales_nav_accounts` - Sales Navigator account information

## Authentication Compatibility

The support-frontend uses the **exact same authentication system** as the main Enrich API (`databox-enrich-api-server`):

- **User Model**: Uses the same User schema with all fields (uid, role, email, etc.) plus `has_support_dashboard_access` field
- **OTP System**: Same OTP generation and validation logic
- **JWT Tokens**: Signed with the same `JWT_SECRET` for cross-compatibility
- **Granular Access Control**: Uses `has_support_dashboard_access` boolean field to control who can access support features
- **Database**: Shares the same MongoDB database and collections

This means:
- Any user from the main API can be granted access by setting `has_support_dashboard_access: true`
- No separate user management needed
- Consistent authentication across all Enrich services
- JWT tokens use the same signing algorithm (HS256)
- Fine-grained control - give access only to specific support team members

## Managing Support Access

### Grant Access to a User

To grant support dashboard access to a user, update their document in MongoDB:

**Using MongoDB Shell:**
```javascript
use enrich;
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { has_support_dashboard_access: true } }
);
```

**Using MongoDB Compass or Studio 3T:**
1. Connect to your MongoDB instance
2. Navigate to `enrich` database → `users` collection
3. Find the user by email
4. Add/update field: `has_support_dashboard_access: true`
5. Save the document

### Revoke Access from a User

```javascript
use enrich;
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { has_support_dashboard_access: false } }
);
```

### List All Users with Support Access

```javascript
use enrich;
db.users.find(
  { has_support_dashboard_access: true },
  { email: 1, name: 1, has_support_dashboard_access: 1 }
).pretty();
```

## Notes

- The dashboard is designed for internal use by the Enrich support team
- All operations are logged in the respective collection's history
- Rate limits are stored per team in the `api_limits` field
- Sales Nav accounts can be temporarily disabled without deletion
- OTP delivery currently logs to console - integrate email service for production use
- The `has_support_dashboard_access` field is optional and defaults to `false` for new users

## Support

For issues or questions, contact the Enrich development team.
