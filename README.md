
# Real-Time Chat Application

## Table of Contents
1. [Installation and Setup](#installation-and-setup)
2. [Implementation Status](#implementation-status)
3. [Git Repository Organization](#git-repository-organization)
4. [Data Structures](#data-structures)
5. [Angular Architecture](#angular-architecture)
6. [Node Server Architecture](#node-server-architecture)
7. [API Routes](#api-routes)
8. [Client-Server Interaction](#client-server-interaction)
9. [Testing](#testing)

## Installation and Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Angular CLI
- Git

### Installation Steps
1. Clone the repository
```bash
git clone https://github.com/Tahoor9669/chat-app.git
cd chat-app
```

2. Install server dependencies
```bash
cd server
npm install
```

3. Install client dependencies
```bash
cd ../client
npm install
```

4. Start the application
```bash
# Start MongoDB (if not running)
mongod

# Start server (in server directory)
npm start

# Start client (in client directory)
ng serve
```

Access the application at `http://localhost:4200`

## Implementation Status

### Completed Features ✅
1. User Authentication System
   - Super admin initialization (username: 'super', password: '123')
   - Basic login/registration functionality
   - Role-based access control

2. User Roles Implementation
   - Super Admin
   - Group Admin
   - Channel Admin
   - Regular User

3. MongoDB Integration
   - User data storage
   - Group management
   - Channel management

4. Socket.io Integration
   - Real-time chat functionality
   - Channel message broadcasting

### Partially Implemented Features 🟨
1. User Authentication
   - Basic authentication flow
   - Role assignment in progress

2. Group Management
   - Basic group creation
   - Member management in development

## Git Repository Organization

### Repository Structure
```
chat-app/
├── client/                 # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/  # Angular components
│   │   │   ├── services/    # Angular services
│   │   │   ├── models/      # TypeScript interfaces
│   │   │   └── guards/      # Route guards
│   │   ├── assets/
│   │   └── environments/
└── server/                # Node.js backend
    ├── controllers/       # Route controllers
    ├── models/           # MongoDB schemas
    ├── routes/           # API routes
    ├── middleware/       # Custom middleware
    ├── config/           # Configuration files
    └── utils/            # Utility functions
```

### Git Development Process
1. **Regular Commits**
   - Feature-based commits
   - Clear commit messages
   - Daily updates

2. **Development Workflow**
   - Main branch for stable code
   - Direct commits for individual development
   - Regular pushes to GitHub

3. **Version Control Strategy**
   - Separate commits for frontend and backend changes
   - Regular backups of database schemas
   - Clear documentation updates

## Data Structures

### Client-Side Models

#### User Interface
```typescript
interface User {
  _id: string;
  username: string;
  email: string;
  roles: string[];
  groups: string[];
  avatar?: string;
}

interface Group {
  _id: string;
  name: string;
  admins: User[];
  members: User[];
  channels: Channel[];
}

interface Channel {
  _id: string;
  name: string;
  groupId: string;
  messages: Message[];
}

interface Message {
  _id: string;
  content: string;
  sender: User;
  timestamp: Date;
  type: 'text' | 'image' | 'video';
}
```

### Server-Side Models (MongoDB Schemas)

```javascript
// User Schema
const userSchema = new Schema({
  username: { type: String, unique: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  roles: [String],
  groups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
  avatar: String
});

// Group Schema
const groupSchema = new Schema({
  name: String,
  admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  channels: [{ type: Schema.Types.ObjectId, ref: 'Channel' }]
});

// Channel Schema
const channelSchema = new Schema({
  name: String,
  group: { type: Schema.Types.ObjectId, ref: 'Group' },
  messages: [{
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    content: String,
    timestamp: Date,
    type: String
  }]
});
```

## Angular Architecture

### Components

1. **AppComponent** (`app.component.ts`)
   - Root component
   - Handles global layout
   - Manages authentication state

2. **AuthComponent** (`auth.component.ts`)
   - User login/registration
   - Role-based redirection
   - Authentication error handling

3. **ChatComponent** (`chat.component.ts`)
   - Real-time message display
   - Message input handling
   - WebSocket connection management

4. **GroupListComponent** (`group-list.component.ts`)
   - Displays user's groups
   - Group creation/joining
   - Admin controls

### Services

1. **AuthService** (`auth.service.ts`)
```typescript
export class AuthService {
  login(username: string, password: string): Observable<any>
  register(user: User): Observable<any>
  logout(): void
  isAuthenticated(): boolean
  getCurrentUser(): User
}
```

2. **ChatService** (`chat.service.ts`)
```typescript
export class ChatService {
  connectSocket(): void
  sendMessage(message: Message): void
  joinChannel(channelId: string): void
  leaveChannel(channelId: string): void
  onNewMessage(): Observable<Message>
}
```

3. **GroupService** (`group.service.ts`)
```typescript
export class GroupService {
  getGroups(): Observable<Group[]>
  createGroup(group: Group): Observable<Group>
  joinGroup(groupId: string): Observable<any>
  leaveGroup(groupId: string): Observable<any>
}
```

### Routes
```typescript
const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: AuthComponent },
  { path: 'register', component: AuthComponent },
  { path: 'chat', component: ChatComponent, canActivate: [AuthGuard] },
  { path: 'groups', component: GroupListComponent, canActivate: [AuthGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [AdminGuard] }
];
```

## Node Server Architecture

### Core Files

1. **server.js** (Entry Point)
```javascript
const express = require('express');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

// Global configurations
const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(authMiddleware);

// Route registration
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/channels', channelRoutes);
```

2. **socket.js** (WebSocket Handler)
```javascript
// Socket.io event handlers
io.on('connection', (socket) => {
  socket.on('join-channel', handleJoinChannel);
  socket.on('leave-channel', handleLeaveChannel);
  socket.on('message', handleMessage);
});
```

### Global Variables
```javascript
// Configuration Constants
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3000;

// Socket Events
const SOCKET_EVENTS = {
  MESSAGE: 'message',
  JOIN_CHANNEL: 'join-channel',
  LEAVE_CHANNEL: 'leave-channel',
  USER_TYPING: 'user-typing'
};

// File Upload Configuration
const UPLOAD_PATH = 'uploads/';
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png'];
```

## API Routes

### Authentication Routes
```javascript
POST /api/auth/login
- Parameters: { username, password }
- Returns: { token, user }

POST /api/auth/register
- Parameters: { username, email, password }
- Returns: { message, user }
```

### Group Routes
```javascript
GET /api/groups
- Returns: List of user's groups

POST /api/groups
- Parameters: { name, members }
- Returns: Created group

PUT /api/groups/:id
- Parameters: { name, members, admins }
- Returns: Updated group
```

### Channel Routes
```javascript
GET /api/channels/:id/messages
- Returns: Channel message history

POST /api/channels/:id/messages
- Parameters: { content, type }
- Returns: Created message
```

## Client-Server Interaction

### Real-time Communication Flow

1. **Message Sending Process**
```javascript
// Client Side (Angular)
this.chatService.sendMessage({
  content: messageText,
  channelId: currentChannel,
  type: 'text'
});

// Server Side (Node.js)
socket.on('message', async (data) => {
  const savedMessage = await MessageModel.create(data);
  io.to(data.channelId).emit('new-message', savedMessage);
});
```

2. **Component Updates**
```typescript
// ChatComponent
ngOnInit() {
  this.chatService.onNewMessage().subscribe(message => {
    this.messages.push(message);
    this.scrollToBottom();
  });
}
```

3. **State Synchronization**
- WebSocket events trigger service updates
- Services emit changes to components
- Components re-render with new data

### Error Handling
```typescript
// Client-side error handling
this.chatService.sendMessage(message).catch(error => {
  this.handleError(error);
  this.retryMessage(message);
});

// Server-side error handling
socket.on('error', (error) => {
  socket.emit('error', { message: 'Error processing request' });
});
```

## Testing

### Server-Side Testing
```bash
# Run server tests
cd server
npm test
```

### Client-Side Testing
```bash
# Run Angular tests
cd client
ng test
```

### End-to-End Testing
```bash
# Run e2e tests
cd client
ng e2e
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
=======

>>>>>>> e3cbc1447b18f80ebdf01cd43112f61b08b28a31
