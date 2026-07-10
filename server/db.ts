import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

// Types for our Database models
export interface IUser {
  _id: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  bio: string;
  profilePicture: string;
  coverBanner: string;
  followers: string[]; // User IDs
  following: string[]; // User IDs
  createdAt: string;
}

export interface IComment {
  _id: string;
  user: any; // User ID or Populated IUser
  comment: string;
  createdAt: string;
}

export interface IPost {
  _id: string;
  user: any; // User ID or Populated IUser
  caption: string;
  image: string;
  likes: string[]; // User IDs
  comments: IComment[];
  createdAt: string;
}

export interface INotification {
  _id: string;
  sender: any; // User ID or Populated IUser
  receiver: string; // User ID
  type: 'like' | 'comment' | 'follow';
  postId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface IMessage {
  _id: string;
  sender: string; // User ID
  receiver: string; // User ID
  text: string;
  createdAt: string;
}

// Global connection state
let isMongo = false;
const JSON_DB_PATH = path.join(process.cwd(), 'db.json');

// Mongoose schemas
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String, default: '' },
  profilePicture: { type: String, default: '' },
  coverBanner: { type: String, default: '' },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

const CommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const PostSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  caption: { type: String, required: true },
  image: { type: String, default: '' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [CommentSchema],
  createdAt: { type: Date, default: Date.now }
});

const NotificationSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['like', 'comment', 'follow'], required: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

let UserModel: mongoose.Model<any>;
let PostModel: mongoose.Model<any>;
let NotificationModel: mongoose.Model<any>;
let MessageModel: mongoose.Model<any>;

// Fallback JSON DB Implementation
class LocalJSONDb {
  private data: {
    users: IUser[];
    posts: IPost[];
    notifications: INotification[];
    messages: IMessage[];
  } = { users: [], posts: [], notifications: [], messages: [] };

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(JSON_DB_PATH)) {
        const fileContent = fs.readFileSync(JSON_DB_PATH, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        this.save();
      }
    } catch (e) {
      console.error('Error loading JSON DB:', e);
    }
  }

  public save() {
    try {
      fs.writeFileSync(JSON_DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving JSON DB:', e);
    }
  }

  // User Actions
  public getUsers() { this.load(); return this.data.users; }
  public setUsers(users: IUser[]) { this.data.users = users; this.save(); }

  // Post Actions
  public getPosts() { this.load(); return this.data.posts; }
  public setPosts(posts: IPost[]) { this.data.posts = posts; this.save(); }

  // Notification Actions
  public getNotifications() { this.load(); return this.data.notifications; }
  public setNotifications(notifications: INotification[]) { this.data.notifications = notifications; this.save(); }

  // Message Actions
  public getMessages() { this.load(); return this.data.messages; }
  public setMessages(messages: IMessage[]) { this.data.messages = messages; this.save(); }
}

const localDb = new LocalJSONDb();

// Unified API that works with Mongo or Fallback
export const db = {
  isMongo: () => isMongo,

  // Connect to Database
  connect: async () => {
    const mongoUri = process.env.MONGO_URI;
    if (mongoUri) {
      try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(mongoUri);
        isMongo = true;
        console.log('Successfully connected to MongoDB Atlas!');

        UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
        PostModel = mongoose.models.Post || mongoose.model('Post', PostSchema);
        NotificationModel = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
        MessageModel = mongoose.models.Message || mongoose.model('Message', MessageSchema);
      } catch (err) {
        console.error('MongoDB Atlas Connection Error, falling back to Local JSON DB:', err);
        isMongo = false;
      }
    } else {
      console.log('No MONGO_URI provided in environmental variables. Running on standard Local JSON Database fallback (db.json) for live sandbox preview.');
      isMongo = false;
    }

    // Seed database if it's empty
    await db.seedIfEmpty();
  },

  // USER CRUD
  users: {
    find: async (query: any = {}) => {
      if (isMongo) {
        return UserModel.find(query).select('-password');
      } else {
        let users = localDb.getUsers();
        if (query.username) {
          const regex = new RegExp(query.username, 'i');
          users = users.filter(u => regex.test(u.username));
        }
        if (query.name) {
          const regex = new RegExp(query.name, 'i');
          users = users.filter(u => regex.test(u.name));
        }
        // Return without password for safety
        return users.map(({ password, ...u }) => u);
      }
    },

    findOne: async (query: any) => {
      if (isMongo) {
        return UserModel.findOne(query);
      } else {
        const users = localDb.getUsers();
        const found = users.find(u => {
          for (const key in query) {
            if (u[key as keyof IUser] !== query[key]) return false;
          }
          return true;
        });
        return found ? { ...found } : null;
      }
    },

    findById: async (id: string) => {
      if (isMongo) {
        return UserModel.findById(id).select('-password');
      } else {
        const users = localDb.getUsers();
        const found = users.find(u => u._id === id);
        if (found) {
          const { password, ...safeUser } = found;
          return safeUser;
        }
        return null;
      }
    },

    create: async (userData: any) => {
      if (isMongo) {
        return UserModel.create(userData);
      } else {
        const users = localDb.getUsers();
        const newUser: IUser = {
          _id: Math.random().toString(36).substr(2, 9),
          followers: [],
          following: [],
          bio: '',
          profilePicture: '',
          coverBanner: '',
          createdAt: new Date().toISOString(),
          ...userData
        };
        users.push(newUser);
        localDb.setUsers(users);
        return newUser;
      }
    },

    findByIdAndUpdate: async (id: string, updateData: any) => {
      if (isMongo) {
        return UserModel.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
      } else {
        const users = localDb.getUsers();
        const index = users.findIndex(u => u._id === id);
        if (index !== -1) {
          users[index] = { ...users[index], ...updateData };
          localDb.setUsers(users);
          const { password, ...safeUser } = users[index];
          return safeUser;
        }
        return null;
      }
    },

    followToggle: async (userId: string, targetId: string, isFollow: boolean) => {
      if (isMongo) {
        if (isFollow) {
          await UserModel.findByIdAndUpdate(userId, { $addToSet: { following: targetId } });
          await UserModel.findByIdAndUpdate(targetId, { $addToSet: { followers: userId } });
        } else {
          await UserModel.findByIdAndUpdate(userId, { $pull: { following: targetId } });
          await UserModel.findByIdAndUpdate(targetId, { $pull: { followers: userId } });
        }
        return true;
      } else {
        const users = localDb.getUsers();
        const uIndex = users.findIndex(u => u._id === userId);
        const tIndex = users.findIndex(u => u._id === targetId);
        if (uIndex !== -1 && tIndex !== -1) {
          const user = users[uIndex];
          const target = users[tIndex];

          if (isFollow) {
            if (!user.following.includes(targetId)) user.following.push(targetId);
            if (!target.followers.includes(userId)) target.followers.push(userId);
          } else {
            user.following = user.following.filter(id => id !== targetId);
            target.followers = target.followers.filter(id => id !== userId);
          }
          localDb.setUsers(users);
          return true;
        }
        return false;
      }
    }
  },

  // POST CRUD
  posts: {
    find: async (query: any = {}) => {
      if (isMongo) {
        return PostModel.find(query)
          .populate('user', 'name username profilePicture')
          .populate('comments.user', 'name username profilePicture')
          .sort({ createdAt: -1 });
      } else {
        let posts = localDb.getPosts();
        if (query.user) {
          posts = posts.filter(p => p.user === query.user || (p.user && p.user._id === query.user));
        }

        // Hydrate posts with user details and comment users
        const users = localDb.getUsers();
        const populatedPosts = posts.map(p => {
          const postUser = users.find(u => u._id === (p.user._id || p.user));
          const commentsWithUsers = p.comments.map(c => {
            const commentUser = users.find(u => u._id === (c.user._id || c.user));
            return {
              ...c,
              user: commentUser ? {
                _id: commentUser._id,
                name: commentUser.name,
                username: commentUser.username,
                profilePicture: commentUser.profilePicture
              } : { _id: 'deleted', name: 'Deleted User', username: 'deleted', profilePicture: '' }
            };
          });

          return {
            ...p,
            user: postUser ? {
              _id: postUser._id,
              name: postUser.name,
              username: postUser.username,
              profilePicture: postUser.profilePicture
            } : { _id: 'deleted', name: 'Deleted User', username: 'deleted', profilePicture: '' },
            comments: commentsWithUsers
          };
        });

        // Sort by date descending
        return populatedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    },

    findById: async (id: string) => {
      if (isMongo) {
        return PostModel.findById(id)
          .populate('user', 'name username profilePicture')
          .populate('comments.user', 'name username profilePicture');
      } else {
        const posts = localDb.getPosts();
        const p = posts.find(item => item._id === id);
        if (!p) return null;

        const users = localDb.getUsers();
        const postUser = users.find(u => u._id === (p.user._id || p.user));
        const commentsWithUsers = p.comments.map(c => {
          const commentUser = users.find(u => u._id === (c.user._id || c.user));
          return {
            ...c,
            user: commentUser ? {
              _id: commentUser._id,
              name: commentUser.name,
              username: commentUser.username,
              profilePicture: commentUser.profilePicture
            } : { _id: 'deleted', name: 'Deleted User', username: 'deleted', profilePicture: '' }
          };
        });

        return {
          ...p,
          user: postUser ? {
            _id: postUser._id,
            name: postUser.name,
            username: postUser.username,
            profilePicture: postUser.profilePicture
          } : { _id: 'deleted', name: 'Deleted User', username: 'deleted', profilePicture: '' },
          comments: commentsWithUsers
        };
      }
    },

    create: async (postData: any) => {
      if (isMongo) {
        const newPost = await PostModel.create(postData);
        return newPost.populate('user', 'name username profilePicture');
      } else {
        const posts = localDb.getPosts();
        const newPost: IPost = {
          _id: Math.random().toString(36).substr(2, 9),
          likes: [],
          comments: [],
          createdAt: new Date().toISOString(),
          ...postData
        };
        posts.push(newPost);
        localDb.setPosts(posts);

        const users = localDb.getUsers();
        const postUser = users.find(u => u._id === newPost.user);
        return {
          ...newPost,
          user: postUser ? {
            _id: postUser._id,
            name: postUser.name,
            username: postUser.username,
            profilePicture: postUser.profilePicture
          } : { _id: 'deleted', name: 'Deleted User', username: 'deleted', profilePicture: '' }
        };
      }
    },

    findByIdAndUpdate: async (id: string, updateData: any) => {
      if (isMongo) {
        return PostModel.findByIdAndUpdate(id, updateData, { new: true })
          .populate('user', 'name username profilePicture');
      } else {
        const posts = localDb.getPosts();
        const index = posts.findIndex(p => p._id === id);
        if (index !== -1) {
          posts[index] = { ...posts[index], ...updateData };
          localDb.setPosts(posts);
          return posts[index];
        }
        return null;
      }
    },

    deleteOne: async (id: string) => {
      if (isMongo) {
        return PostModel.deleteOne({ _id: id });
      } else {
        const posts = localDb.getPosts();
        const filtered = posts.filter(p => p._id !== id);
        localDb.setPosts(filtered);
        return { deletedCount: posts.length - filtered.length };
      }
    },

    likeToggle: async (postId: string, userId: string, isLike: boolean) => {
      if (isMongo) {
        if (isLike) {
          return PostModel.findByIdAndUpdate(postId, { $addToSet: { likes: userId } }, { new: true })
            .populate('user', 'name username profilePicture');
        } else {
          return PostModel.findByIdAndUpdate(postId, { $pull: { likes: userId } }, { new: true })
            .populate('user', 'name username profilePicture');
        }
      } else {
        const posts = localDb.getPosts();
        const index = posts.findIndex(p => p._id === postId);
        if (index !== -1) {
          const post = posts[index];
          if (isLike) {
            if (!post.likes.includes(userId)) post.likes.push(userId);
          } else {
            post.likes = post.likes.filter(id => id !== userId);
          }
          localDb.setPosts(posts);
          return db.posts.findById(postId);
        }
        return null;
      }
    },

    addComment: async (postId: string, commentData: { user: string, comment: string }) => {
      const commentId = Math.random().toString(36).substr(2, 9);
      if (isMongo) {
        const updated = await PostModel.findByIdAndUpdate(
          postId,
          { $push: { comments: { _id: commentId, ...commentData, createdAt: new Date() } } },
          { new: true }
        ).populate('user', 'name username profilePicture')
         .populate('comments.user', 'name username profilePicture');
        return updated;
      } else {
        const posts = localDb.getPosts();
        const index = posts.findIndex(p => p._id === postId);
        if (index !== -1) {
          const post = posts[index];
          const newComment: IComment = {
            _id: commentId,
            user: commentData.user,
            comment: commentData.comment,
            createdAt: new Date().toISOString()
          };
          post.comments.push(newComment);
          localDb.setPosts(posts);
          return db.posts.findById(postId);
        }
        return null;
      }
    },

    deleteComment: async (postId: string, commentId: string) => {
      if (isMongo) {
        return PostModel.findByIdAndUpdate(
          postId,
          { $pull: { comments: { _id: commentId } } },
          { new: true }
        ).populate('user', 'name username profilePicture')
         .populate('comments.user', 'name username profilePicture');
      } else {
        const posts = localDb.getPosts();
        const index = posts.findIndex(p => p._id === postId);
        if (index !== -1) {
          const post = posts[index];
          post.comments = post.comments.filter(c => c._id !== commentId);
          localDb.setPosts(posts);
          return db.posts.findById(postId);
        }
        return null;
      }
    }
  },

  // NOTIFICATION CRUD
  notifications: {
    find: async (query: any) => {
      if (isMongo) {
        return NotificationModel.find(query)
          .populate('sender', 'name username profilePicture')
          .sort({ createdAt: -1 });
      } else {
        const notifications = localDb.getNotifications();
        const filtered = notifications.filter(n => n.receiver === query.receiver);

        const users = localDb.getUsers();
        const populated = filtered.map(n => {
          const senderUser = users.find(u => u._id === (n.sender._id || n.sender));
          return {
            ...n,
            sender: senderUser ? {
              _id: senderUser._id,
              name: senderUser.name,
              username: senderUser.username,
              profilePicture: senderUser.profilePicture
            } : { _id: 'deleted', name: 'Deleted User', username: 'deleted', profilePicture: '' }
          };
        });

        return populated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    },

    create: async (notifData: any) => {
      if (isMongo) {
        return NotificationModel.create(notifData);
      } else {
        const notifications = localDb.getNotifications();
        const newNotif: INotification = {
          _id: Math.random().toString(36).substr(2, 9),
          isRead: false,
          createdAt: new Date().toISOString(),
          ...notifData
        };
        notifications.push(newNotif);
        localDb.setNotifications(notifications);
        return newNotif;
      }
    },

    markAllAsRead: async (receiverId: string) => {
      if (isMongo) {
        return NotificationModel.updateMany({ receiver: receiverId }, { isRead: true });
      } else {
        const notifications = localDb.getNotifications();
        notifications.forEach(n => {
          if (n.receiver === receiverId) {
            n.isRead = true;
          }
        });
        localDb.setNotifications(notifications);
        return { modifiedCount: notifications.length };
      }
    }
  },

  // CHAT MESSAGES CRUD
  messages: {
    find: async (query: any) => {
      const { user1, user2 } = query;
      if (isMongo) {
        return MessageModel.find({
          $or: [
            { sender: user1, receiver: user2 },
            { sender: user2, receiver: user1 }
          ]
        }).sort({ createdAt: 1 });
      } else {
        const messages = localDb.getMessages();
        const conversation = messages.filter(m => 
          (m.sender === user1 && m.receiver === user2) ||
          (m.sender === user2 && m.receiver === user1)
        );
        return conversation.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
    },

    create: async (msgData: any) => {
      if (isMongo) {
        return MessageModel.create(msgData);
      } else {
        const messages = localDb.getMessages();
        const newMsg: IMessage = {
          _id: Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString(),
          ...msgData
        };
        messages.push(newMsg);
        localDb.setMessages(messages);
        return newMsg;
      }
    }
  },

  // AUTOMATIC SEED SYSTEM
  seedIfEmpty: async () => {
    let usersCount = 0;
    if (isMongo) {
      usersCount = await UserModel.countDocuments();
    } else {
      usersCount = localDb.getUsers().length;
    }

    if (usersCount > 0) {
      console.log('Database already contains data. Skipping automatic seed.');
      return;
    }

    console.log('Database is empty. Initiating automatic seeding of 10 users and 30 rich posts...');

    // 10 sample user records (unhashed passwords for seed, we will hash them below)
    const rawUsers = [
      { id: 'u1', name: 'Alex Rivera', username: 'alex_codes', email: 'alex@example.com', bio: 'Full-stack software engineer & tech content creator. Building elegant web products. 💻✨', pfp: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop', banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=250&fit=crop' },
      { id: 'u2', name: 'David Chen', username: 'david_dev', email: 'david@example.com', bio: 'TypeScript lover. Open source contributor. Exploring AI capabilities and distributed databases. 🛠️🛡️', pfp: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop', banner: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=800&h=250&fit=crop' },
      { id: 'u3', name: 'Sophia Martinez', username: 'sophia_design', email: 'sophia@example.com', bio: 'UI/UX Designer. Pixel perfect advocate. Turning wireframes into breathtaking visual journeys. 🎨📐', pfp: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop', banner: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&h=250&fit=crop' },
      { id: 'u4', name: 'Jordan Patel', username: 'jordan_builds', email: 'jordan@example.com', bio: 'SaaS founder & indie hacker. Building public in 2026. Sharing lessons on scaling products. 🚀📈', pfp: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop', banner: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=250&fit=crop' },
      { id: 'u5', name: 'Emma Watson', username: 'emma_writes', email: 'emma@example.com', bio: 'Tech writer & digital nomad. Writing about the intersection of humanity, design, and code. ✍️🎒', pfp: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop', banner: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=250&fit=crop' },
      { id: 'u6', name: 'Marcus Miller', username: 'marcus_cyber', email: 'marcus@example.com', bio: 'Cybersecurity specialist. Penetration tester. Defending systems by day, breaking them by night. 🛡️💻', pfp: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop', banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=250&fit=crop' },
      { id: 'u7', name: 'Aria Takahashi', username: 'aria_codes', email: 'aria@example.com', bio: 'Frontend engineer from Tokyo. Passionate about WebGL, interactive designs, and animations. 🌸🌌', pfp: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop', banner: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&h=250&fit=crop' },
      { id: 'u8', name: 'Liam Sterling', username: 'liam_scale', email: 'liam@example.com', bio: 'Cloud architect & DevOps guru. Making servers dance to the tune of Kubernetes. ⚙️☁️', pfp: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop', banner: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=250&fit=crop' },
      { id: 'u9', name: 'Clara Oswald', username: 'clara_data', email: 'clara@example.com', bio: 'Data Scientist. Finding patterns in noise. Machine learning models & cute pandas. 🐼📊', pfp: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop', banner: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=250&fit=crop' },
      { id: 'u10', name: 'Ryan Kim', username: 'ryan_mobile', email: 'ryan@example.com', bio: 'iOS & Flutter Developer. Crafting beautiful pocket companions. Coffee lover. ☕📱', pfp: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&h=150&fit=crop', banner: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=250&fit=crop' }
    ];

    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const seededUsers: IUser[] = [];

    // Save users
    for (const r of rawUsers) {
      const userObj = {
        name: r.name,
        username: r.username,
        email: r.email,
        password: hashedPassword,
        bio: r.bio,
        profilePicture: r.pfp,
        coverBanner: r.banner,
        followers: [] as string[],
        following: [] as string[],
        createdAt: new Date(Date.now() - Math.random() * 100 * 24 * 60 * 60 * 1000).toISOString()
      };

      if (isMongo) {
        const doc = await UserModel.create(userObj);
        seededUsers.push({
          ...userObj,
          _id: doc._id.toString()
        });
      } else {
        const id = r.id;
        const completeUser = { ...userObj, _id: id };
        seededUsers.push(completeUser);
      }
    }

    // Connect them with some sample follower relationships
    // alex (0) follows david (1), sophia (2), emma (4)
    // david (1) follows alex (0), sophia (2), jordan (3)
    // etc.
    const relations = [
      [0, 1], [0, 2], [0, 4],
      [1, 0], [1, 2], [1, 3],
      [2, 0], [2, 1], [2, 3], [2, 6],
      [3, 0], [3, 4], [3, 7],
      [4, 0], [4, 2], [4, 8],
      [5, 1], [5, 7], [5, 9],
      [6, 0], [6, 2], [6, 8],
      [7, 1], [7, 3], [7, 9],
      [8, 1], [8, 4], [8, 5],
      [9, 0], [9, 2], [9, 7]
    ];

    for (const [fIdx, tIdx] of relations) {
      const follower = seededUsers[fIdx];
      const target = seededUsers[tIdx];
      follower.following.push(target._id);
      target.followers.push(follower._id);
    }

    if (isMongo) {
      for (const u of seededUsers) {
        await UserModel.findByIdAndUpdate(u._id, {
          followers: u.followers,
          following: u.following
        });
      }
    } else {
      localDb.setUsers(seededUsers);
    }

    // 30 rich mock posts with appropriate captions and nice unsplash images
    const postAssets = [
      { userIndex: 0, caption: 'Just launched my brand new workspace layout! Cable management took forever but the aesthetic clean lines are totally worth it. Let\'s write some code! 💻⚡ #workspace #deskinspiration #coder', img: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=600&h=400&fit=crop' },
      { userIndex: 1, caption: 'TypeScript 5.8 is absolutely incredible! The compiler speed improvements and smarter type narrowing make code feel so much safer. Who else has upgraded? 🛠️ TypeScript rules!', img: 'https://images.unsplash.com/photo-1516116211223-5c359a36298a?w=600&h=400&fit=crop' },
      { userIndex: 2, caption: 'Spent my morning crafting this micro-interaction for a checkout page. Smooth animations really do make standard apps feel premium. Keep designing! 📐🌸 #uidesign #motion', img: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=600&h=400&fit=crop' },
      { userIndex: 3, caption: 'Milestone unlocked: Passed $2,500 MRR on my SaaS builder platform! The road of an indie hacker is full of twists but consistency always wins. 🚀 Let\'s scale!', img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop' },
      { userIndex: 4, caption: 'Writing by the sea today. Digital nomad life has its challenges, but this office view is hard to beat. 🐚📝 #workfromanywhere #nomad', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop' },
      { userIndex: 5, caption: 'Friendly reminder to always update your dependencies! Just patched a security vulnerability in a legacy codebase. Keep your software safe. 🛡️🔐 #cybersecurity', img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=400&fit=crop' },
      { userIndex: 6, caption: 'Tokyo lights at night are on another level. Working on a WebGL shader that captures this vibrant neon energy. 🌌🗼 #tokyo #webgl', img: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&h=400&fit=crop' },
      { userIndex: 7, caption: 'Spinning up a multi-region Kubernetes cluster today. Overkill for my blog? Yes. Extremely fun to configure? ABSOLUTELY. ⚙️☁️ #devops', img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop' },
      { userIndex: 8, caption: 'Pandas & Jupyter notebooks: my constant companions. Analyzing a massive dataset to uncover hidden web traffic trends. Data is beautiful! 📊🐼', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop' },
      { userIndex: 9, caption: 'Brewing a fresh espresso before diving into Swift UI layout debugging. Coffee is the fuel that turns lines into pocket apps! ☕📱 #iosdev', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&h=400&fit=crop' },

      // Additional posts to reach 30
      { userIndex: 0, caption: 'Why does CSS centering feel like a boss battle? Finally solved a nested flexbox alignment bug. Feel like a genius now. 😂', img: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&h=400&fit=crop' },
      { userIndex: 1, caption: 'Contributing to open source isn\'t just about writing code; it\'s about writing pristine documentation. Merged my first major PR of the week!', img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop' },
      { userIndex: 2, caption: 'Choosing colors is the hardest part of UI design. Opted for an organic warm theme for this health journal app. What do you think?', img: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&h=400&fit=crop' },
      { userIndex: 3, caption: 'Shipped a new feature in less than 24 hours! Feedback loop with real users is the ultimate shortcut to SaaS product-market fit. 🚀', img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop' },
      { userIndex: 4, caption: 'Reading on tech ethics today. With AI accelerating daily, understanding our responsibility as creators is critical. 📖🧠', img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=400&fit=crop' },
      { userIndex: 5, caption: 'Phishing attacks are getting sophisticated. Always double check sender addresses and never click unverified links! 🛡️🔐', img: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&h=400&fit=crop' },
      { userIndex: 6, caption: 'Interactive canvas animations using simple trigonometry. Math is actually beautiful when you can render it live on screen!', img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop' },
      { userIndex: 7, caption: 'Serverless architecture vs. VM servers. The eternal debate. For high scale and random traffic spikes, serverless is such a win. ⚙️', img: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&h=400&fit=crop' },
      { userIndex: 8, caption: 'Training a random forest model. Beautiful performance on high dimensional data, but interpreting results requires patience!', img: 'https://images.unsplash.com/photo-1527474305487-b87b222841cc?w=600&h=400&fit=crop' },
      { userIndex: 9, caption: 'My Flutter compile failed. Rebuilding packages... Ah, a simple bracket typo! Classic mobile development moments. 📱', img: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop' },

      { userIndex: 0, caption: 'Morning run followed by a solid coding session. Keeping body and mind active is the ultimate cheat code for developers! 🏃‍♂️⚡', img: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&h=400&fit=crop' },
      { userIndex: 1, caption: 'React 19 Server Actions are going to revolutionize how we handle basic fullstack data loading. Less boilerplate, more productivity!', img: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=400&fit=crop' },
      { userIndex: 2, caption: 'Dark mode is not just custom colors; it requires adjusting contrast for text and element elevations. A designer\'s work never ends.', img: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&h=400&fit=crop' },
      { userIndex: 3, caption: 'Don\'t wait for perfection. Launch early, listen to users, iterate. That\'s the indie hacking bible.', img: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&h=400&fit=crop' },
      { userIndex: 4, caption: 'Coffee, notepad, a quiet beach, and a head full of ideas. Ready to map out my next tech column! 🌊📝', img: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&h=400&fit=crop' },
      { userIndex: 5, caption: 'Secure coding starts with validating inputs. Never trust user submitted client payloads directly in SQL or queries! 🛡️', img: 'https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=600&h=400&fit=crop' },
      { userIndex: 6, caption: 'Testing out responsive SVG layouts. Combining art and code is my absolute favorite way to spend the evening.', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=400&fit=crop' },
      { userIndex: 7, caption: 'Automated CI/CD pipelines reduce release friction to zero. Commit to main -> tests run -> auto deploy to Cloud. Bliss.', img: 'https://images.unsplash.com/photo-1618401471353-b98aedd07871?w=600&h=400&fit=crop' },
      { userIndex: 8, caption: 'Exploratory data analysis is like modern detective work. The anomalies are usually where the real insights are hiding!', img: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&h=400&fit=crop' },
      { userIndex: 9, caption: 'Reviewing App Store submissions. Fingers crossed that the review team loves this simple productivity companion! 🤞📱', img: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=400&fit=crop' }
    ];

    const seededPosts: IPost[] = [];

    // Comments data
    const sampleComments = [
      'This is an absolute masterpiece! Great post.',
      'Could not agree more! Thanks for sharing this.',
      'Really insightful! Bookmarking this for later.',
      'Super cool! How did you handle that custom routing?',
      'Stellar work as always. Keep it up!',
      'This is incredibly inspiring. Loving the aesthetic!',
      'Let\'s connect! Would love to chat about this.',
      'Haha, so relatable! Happened to me yesterday.',
      'Wow! That Unsplash image looks brilliant.',
      'Which framework are you using here?'
    ];

    for (let i = 0; i < postAssets.length; i++) {
      const asset = postAssets[i];
      const author = seededUsers[asset.userIndex];

      // Give each post a random subset of likes
      const likesCount = Math.floor(Math.random() * 6) + 1; // 1 to 6 likes
      const likes: string[] = [];
      const likedUserIndices = new Set<number>();
      while (likedUserIndices.size < likesCount) {
        likedUserIndices.add(Math.floor(Math.random() * seededUsers.length));
      }
      likedUserIndices.forEach(idx => {
        likes.push(seededUsers[idx]._id);
      });

      // Give each post a random subset of 1-3 comments
      const commentsCount = Math.floor(Math.random() * 3) + 1;
      const comments: IComment[] = [];
      for (let c = 0; c < commentsCount; c++) {
        const commentAuthor = seededUsers[Math.floor(Math.random() * seededUsers.length)];
        comments.push({
          _id: Math.random().toString(36).substr(2, 9),
          user: isMongo ? new mongoose.Types.ObjectId(commentAuthor._id) : commentAuthor._id,
          comment: sampleComments[Math.floor(Math.random() * sampleComments.length)],
          createdAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      const postObj = {
        user: isMongo ? new mongoose.Types.ObjectId(author._id) : author._id,
        caption: asset.caption,
        image: asset.img,
        likes: likes,
        comments: comments,
        createdAt: new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString() // space them out
      };

      if (isMongo) {
        const doc = await PostModel.create(postObj);
        seededPosts.push({
          ...postObj,
          _id: doc._id.toString()
        });
      } else {
        const completePost = {
          ...postObj,
          _id: Math.random().toString(36).substr(2, 9)
        } as unknown as IPost;
        seededPosts.push(completePost);
      }
    }

    if (!isMongo) {
      localDb.setPosts(seededPosts);
    }

    // Seed a few messages
    const seededMessages = [
      { sender: seededUsers[0]._id, receiver: seededUsers[1]._id, text: 'Hey David! Loving your content on TypeScript.' },
      { sender: seededUsers[1]._id, receiver: seededUsers[0]._id, text: 'Hey Alex! Thanks so much, appreciate it. Your workspace is super tidy!' },
      { sender: seededUsers[0]._id, receiver: seededUsers[1]._id, text: 'Haha, took me three hours to hide all those cables.' },
      { sender: seededUsers[2]._id, receiver: seededUsers[0]._id, text: 'Sophia here! Let me know if you need any UI help for your new app.' },
      { sender: seededUsers[0]._id, receiver: seededUsers[2]._id, text: 'Hi Sophia! That would be amazing, your designs are beautiful!' }
    ];

    if (isMongo) {
      await MessageModel.insertMany(seededMessages);
    } else {
      localDb.setMessages(seededMessages as IMessage[]);
    }

    // Seed a few notifications
    const seededNotifs = [
      { sender: seededUsers[1]._id, receiver: seededUsers[0]._id, type: 'follow', isRead: false },
      { sender: seededUsers[2]._id, receiver: seededUsers[0]._id, type: 'follow', isRead: false },
      { sender: seededUsers[1]._id, receiver: seededUsers[0]._id, type: 'like', postId: seededPosts[0]._id, isRead: false },
      { sender: seededUsers[2]._id, receiver: seededUsers[0]._id, type: 'comment', postId: seededPosts[0]._id, isRead: false }
    ];

    if (isMongo) {
      await NotificationModel.insertMany(seededNotifs);
    } else {
      localDb.setNotifications(seededNotifs as unknown as INotification[]);
    }

    console.log('Database seeding completed successfully!');
  }
};
