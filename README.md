# Real-Time Chat Application Documentation

## Git Repository Organization

### Repository Structure
```
chat-app/
├── client/              # Angular frontend
│   ├── src/
│   │   ├── app/        # Angular components
│   │   ├── assets/     # Static files
│   │   └── styles/     # Global styles
└── server/             # Node.js backend
    ├── controllers/    # Route controllers
    ├── models/        # MongoDB schemas
    ├── routes/        # API routes
    └── config/        # Configuration files
```

### Git Development Process
- Maintained code in `main` branch
- Regular commits with descriptive messages
- Frequent updates to track progress
- Separated frontend and backend development in distinct folders

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

### Server-Side Models

#### MongoDB Schemas
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
1. **AuthComponent**
   - Handles user login/registration
   - Manages authentication state

2. **ChatComponent**
   - Main chat interface
   - Displays messages and user list
   - Handles message input

3. **GroupListComponent**
   - Shows available groups
   - Manages group creation/joining

4. **ChannelComponent**
   - Displays channel messages
   - Handles message sending
   - Shows channel members

### Services
1. **AuthService**
   - Manages user authentication
   - Handles JWT tokens
   - User session management

2. **ChatService**
   - WebSocket connection management
   - Real-time message handling
   - Channel subscription management

3. **GroupService**
   - Group CRUD operations
   - Member management
   - Channel operations

### Routes
```typescript
const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: AuthComponent },
  { path: 'chat', component: ChatComponent, canActivate: [AuthGuard] },
  { path: 'groups', component: GroupListComponent, canActivate: [AuthGuard] },
  { path: 'groups/:groupId/channels/:channelId', component: ChannelComponent }
];
```

## Node Server Architecture

### Core Modules
- **Express.js**: Web application framework
- **Socket.io**: Real-time communication
- **Mongoose**: MongoDB ODM
- **JWT**: Authentication
- **Multer**: File uploads

### Key Files
1. **server.js**
   - Application entry point
   - Server configuration
   - Middleware setup

2. **socket.js**
   - WebSocket event handlers
   - Real-time messaging logic
   - Connection management

3. **database.js**
   - MongoDB connection
   - Database configuration

### Global Variables
```javascript
const SOCKET_EVENTS = {
  MESSAGE: 'message',
  JOIN_CHANNEL: 'joinChannel',
  LEAVE_CHANNEL: 'leaveChannel',
  USER_TYPING: 'userTyping'
};

const FILE_UPLOAD_PATH = 'uploads/';
const MAX_MESSAGE_HISTORY = 50;
```

## API Routes

### Authentication
```javascript
POST /api/auth/login
- Parameters: { username, password }
- Returns: { token, user }

POST /api/auth/register
- Parameters: { username, email, password }
- Returns: { message, user }
```

### Groups
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

### Channels
```javascript
GET /api/channels/:id/messages
- Returns: Channel message history

POST /api/channels/:id/messages
- Parameters: { content, type }
- Returns: Created message
```

## Client-Server Interaction

### Real-time Updates
1. **Message Flow**
   - Client sends message through WebSocket
   - Server broadcasts to channel subscribers
   - Clients update UI with new message

2. **State Management**
   - Services maintain current state
   - Components subscribe to services
   - Real-time updates trigger UI changes

3. **Data Synchronization**
   - Initial data loaded via REST API
   - Real-time updates via WebSocket
   - Periodic state reconciliation

### Error Handling
- Network error recovery
- Automatic reconnection
- Message delivery confirmation

## Testing
- Server routes tested with Jest
- Angular components tested with Karma
- E2E testing with Protractor
