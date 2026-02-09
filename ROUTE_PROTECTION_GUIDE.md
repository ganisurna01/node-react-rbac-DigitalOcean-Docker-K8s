# Route Protection Guide - Project 2

## 🎯 Overview

This project demonstrates **robust route-level RBAC protection** where users cannot access pages they don't have permission for, even if they try to navigate directly via URL.

## ❓ Where to Implement Route Protection?

### ✅ **Answer: In App.js (Recommended Approach)**

Route protection should be implemented **at the routing level in App.js**, not inside individual page components. Here's why:

#### **Why App.js?**
1. **Centralized Control**: All route protection logic in one place
2. **Prevents Access**: Blocks unauthorized access before component renders
3. **Better UX**: Redirects happen immediately, no flash of unauthorized content
4. **Maintainable**: Easy to see all protected routes at a glance
5. **Reusable**: Protection components can be used for multiple routes

#### **Why NOT in Individual Pages?**
1. **Security Risk**: User might see content briefly before redirect
2. **Code Duplication**: Same protection logic in every page
3. **Harder to Maintain**: Changes require updating multiple files
4. **Poor UX**: Page loads then redirects (slower, jarring)

---

## 🏗️ Architecture

### Route Protection Flow

```
User tries to access /admin
    ↓
App.js checks route protection
    ↓
RoleProtectedRoute component
    ↓
Checks if user.role is in allowedRoles
    ↓
✅ Yes → Render AdminPage
❌ No → Redirect to /unauthorized
```

---

## 📁 File Structure

```
client/src/
├── App.js                    ← Route protection implemented HERE
├── components/
│   ├── ProtectedRoute.js     ← Basic auth check (any logged-in user)
│   ├── RoleProtectedRoute.js ← Role-based protection (specific roles)
│   └── Navigation.js         ← Shows/hides links based on role
└── pages/
    ├── Home.js               ← No protection needed (already protected by route)
    ├── UserPage.js           ← No protection needed (already protected by route)
    ├── ManagerPage.js        ← No protection needed (already protected by route)
    └── AdminPage.js          ← No protection needed (already protected by route)
```

---

## 🔐 How It Works

### 1. **App.js - Route Protection**

```javascript
// App.js
<Route
  path="/manager"
  element={
    <RoleProtectedRoute allowedRoles={['manager', 'admin']}>
      <ManagerPage />
    </RoleProtectedRoute>
  }
/>
```

**What happens:**
- User tries to access `/manager`
- `RoleProtectedRoute` checks if user role is 'manager' or 'admin'
- If yes → renders `ManagerPage`
- If no → redirects to `/unauthorized`

### 2. **RoleProtectedRoute Component**

```javascript
// components/RoleProtectedRoute.js
const RoleProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();

  // Check authentication first
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Then check role
  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // User has required role
  return children;
};
```

**Key Points:**
- Checks authentication first
- Then checks if user role is in `allowedRoles` array
- Redirects if either check fails
- Only renders children if both checks pass

### 3. **Navigation Component - UI Protection**

```javascript
// components/Navigation.js
{canAccess('manager') && (
  <Link to="/manager">Manager Page</Link>
)}
```

**What this does:**
- Hides navigation links for pages user can't access
- Prevents users from even seeing links to unauthorized pages
- **Note**: This is UX only, not security. Route protection in App.js is the real security.

---

## 📊 Route Protection Levels

### Level 1: Public Routes
```javascript
<Route path="/login" element={<Login />} />
<Route path="/register" element={<Register />} />
```
- No protection
- Anyone can access

### Level 2: Authenticated Routes
```javascript
<Route
  path="/user"
  element={
    <ProtectedRoute>
      <UserPage />
    </ProtectedRoute>
  }
/>
```
- Requires authentication only
- Any logged-in user can access
- Uses `ProtectedRoute` component

### Level 3: Role-Based Routes
```javascript
<Route
  path="/manager"
  element={
    <RoleProtectedRoute allowedRoles={['manager', 'admin']}>
      <ManagerPage />
    </RoleProtectedRoute>
  }
/>
```
- Requires specific role(s)
- Only users with matching role can access
- Uses `RoleProtectedRoute` component

---

## 🧪 Testing Route Protection

### Test Scenario 1: Regular User
1. Login as a user with role "user"
2. Try to access `/manager` directly (type in URL)
3. **Result**: Redirected to `/unauthorized`
4. Try to access `/admin` directly
5. **Result**: Redirected to `/unauthorized`

### Test Scenario 2: Manager
1. Login as a user with role "manager"
2. Try to access `/manager`
3. **Result**: Page loads successfully ✅
4. Try to access `/admin`
5. **Result**: Redirected to `/unauthorized` ❌

### Test Scenario 3: Admin
1. Login as a user with role "admin"
2. Try to access `/manager`
3. **Result**: Page loads successfully ✅
4. Try to access `/admin`
5. **Result**: Page loads successfully ✅

---

## 🔑 Key Components Explained

### 1. ProtectedRoute
**Purpose**: Basic authentication check
**Usage**: For routes that require login but no specific role

```javascript
<ProtectedRoute>
  <UserPage />
</ProtectedRoute>
```

### 2. RoleProtectedRoute
**Purpose**: Role-based authorization check
**Usage**: For routes that require specific roles

```javascript
<RoleProtectedRoute allowedRoles={['admin']}>
  <AdminPage />
</RoleProtectedRoute>
```

**Props:**
- `allowedRoles`: Array of roles that can access the route
- `children`: The component to render if access is granted

### 3. Navigation Component
**Purpose**: Hide/show links based on user role
**Note**: This is UX enhancement, not security

```javascript
{canAccess('manager') && (
  <Link to="/manager">Manager Page</Link>
)}
```

---

## 🛡️ Security Best Practices

### ✅ DO:
1. **Protect routes in App.js** - Centralized, prevents access
2. **Use RoleProtectedRoute** - Check roles before rendering
3. **Always validate on backend** - Frontend protection is UX, backend is security
4. **Redirect unauthorized users** - Don't show error, redirect to safe page
5. **Hide navigation links** - Better UX, but not security

### ❌ DON'T:
1. **Don't protect in page components** - Too late, content might flash
2. **Don't rely only on hiding links** - Users can type URLs directly
3. **Don't skip backend validation** - Frontend can be bypassed
4. **Don't show error messages** - Redirect instead
5. **Don't store roles in localStorage** - Get from authenticated API call

---

## 📝 Code Examples

### Example 1: Protecting a Single Role Route

```javascript
// App.js
<Route
  path="/admin"
  element={
    <RoleProtectedRoute allowedRoles={['admin']}>
      <AdminPage />
    </RoleProtectedRoute>
  }
/>
```

### Example 2: Protecting a Multi-Role Route

```javascript
// App.js
<Route
  path="/manager"
  element={
    <RoleProtectedRoute allowedRoles={['manager', 'admin']}>
      <ManagerPage />
    </RoleProtectedRoute>
  }
/>
```

### Example 3: Adding a New Protected Route

```javascript
// 1. Create the page component
// pages/EditorPage.js
const EditorPage = () => {
  return <div>Editor Page</div>;
};

// 2. Add route in App.js
<Route
  path="/editor"
  element={
    <RoleProtectedRoute allowedRoles={['editor', 'admin']}>
      <EditorPage />
    </RoleProtectedRoute>
  }
/>

// 3. Add navigation link (optional, for UX)
{canAccess('editor') && (
  <Link to="/editor">Editor Page</Link>
)}
```

---

## 🎓 Understanding the Flow

### Complete Request Flow:

1. **User types URL**: `/admin`
2. **React Router matches route**: Finds route in App.js
3. **RoleProtectedRoute checks**:
   - Is user authenticated? → Check `isAuthenticated`
   - Does user have required role? → Check `user.role` in `allowedRoles`
4. **If checks pass**: Render `AdminPage`
5. **If checks fail**: Redirect to `/unauthorized`

### What Happens if User Tries Direct Access?

```
User (role: 'user') types: http://localhost:3000/admin
    ↓
App.js route matches
    ↓
RoleProtectedRoute checks: allowedRoles = ['admin']
    ↓
User role is 'user', not in ['admin']
    ↓
Redirect to /unauthorized
    ↓
User sees "Access Denied" page
```

**Result**: User cannot access the page, even by typing URL directly!

---

## 🔄 Comparison: App.js vs Page Component Protection

### ❌ Protection in Page Component (NOT Recommended)

```javascript
// pages/AdminPage.js
const AdminPage = () => {
  const { user } = useAuth();
  
  if (user?.role !== 'admin') {
    return <Navigate to="/unauthorized" />;
  }
  
  return <div>Admin Content</div>;
};
```

**Problems:**
- Component renders first, then redirects (flash of content)
- Code duplication in every protected page
- Harder to see all protected routes

### ✅ Protection in App.js (Recommended)

```javascript
// App.js
<Route
  path="/admin"
  element={
    <RoleProtectedRoute allowedRoles={['admin']}>
      <AdminPage />
    </RoleProtectedRoute>
  }
/>

// pages/AdminPage.js
const AdminPage = () => {
  return <div>Admin Content</div>; // No protection needed here!
};
```

**Benefits:**
- Protection happens before component renders
- Centralized, easy to maintain
- No code duplication
- Clear overview of all protected routes

---

## 📚 Summary

### Where to Implement Route Protection?
**Answer: In App.js using route-level protection components**

### Key Files:
1. **App.js** - Where routes are defined and protected
2. **RoleProtectedRoute.js** - Component that checks roles
3. **Navigation.js** - Hides/shows links (UX only)

### Protection Flow:
```
URL → App.js Route → RoleProtectedRoute → Check Role → Render or Redirect
```

### Security:
- ✅ Frontend protection: Prevents navigation (UX)
- ✅ Backend protection: Validates API requests (Security)
- ✅ Both are needed for robust RBAC

---

## 🚀 Next Steps

1. Test with different user roles
2. Try accessing protected routes directly via URL
3. Observe how unauthorized users are redirected
4. Check how navigation links are hidden/shown
5. Verify backend API also validates roles

**Remember**: Frontend route protection is for UX. Always validate on the backend for security!

