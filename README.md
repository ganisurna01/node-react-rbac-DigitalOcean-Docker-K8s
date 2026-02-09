# RBAC Route Protection - Project 2

A robust full-stack application demonstrating **route-level RBAC protection** where users cannot access pages they don't have permission for.

## 🎯 Key Features

- ✅ **Route-level protection** in App.js (not in individual pages)
- ✅ **Role-based route guards** prevent unauthorized access
- ✅ **Multiple pages** for different roles (User, Manager, Admin)
- ✅ **Navigation menu** that hides unauthorized links
- ✅ **Unauthorized page** for access denied scenarios
- ✅ **Direct URL protection** - users can't bypass by typing URLs

## 🚀 Quick Start

### Backend Setup

```bash
cd project-2/server
npm install
# Create .env file with MongoDB connection string
npm run dev
```

### Frontend Setup

```bash
cd project-2/client
npm install
npm start
```

## 📖 Documentation

See **[ROUTE_PROTECTION_GUIDE.md](./ROUTE_PROTECTION_GUIDE.md)** for:
- Where to implement route protection (App.js vs page components)
- How route protection works
- Complete architecture explanation
- Testing scenarios
- Best practices

## 🏗️ Project Structure

```
project-2/
├── server/              # Backend (same as project-1)
├── client/
│   └── src/
│       ├── App.js       ← Route protection implemented HERE
│       ├── components/
│       │   ├── ProtectedRoute.js      # Basic auth check
│       │   ├── RoleProtectedRoute.js  # Role-based check
│       │   └── Navigation.js          # Role-based menu
│       └── pages/
│           ├── Home.js
│           ├── UserPage.js
│           ├── ManagerPage.js
│           ├── AdminPage.js
│           └── Unauthorized.js
└── ROUTE_PROTECTION_GUIDE.md
```

## 🔐 Route Protection

### How It Works

Route protection is implemented **in App.js** using `RoleProtectedRoute`:

```javascript
<Route
  path="/admin"
  element={
    <RoleProtectedRoute allowedRoles={['admin']}>
      <AdminPage />
    </RoleProtectedRoute>
  }
/>
```

**Result**: Users without 'admin' role are redirected to `/unauthorized` even if they type the URL directly.

## 🧪 Testing

1. Register users with different roles
2. Try accessing protected routes directly via URL
3. Observe how unauthorized users are redirected
4. Check navigation menu shows/hides links based on role

## 📝 Environment Variables

Create `server/.env`:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
```

