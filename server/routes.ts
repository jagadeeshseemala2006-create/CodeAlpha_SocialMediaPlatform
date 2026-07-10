import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { requireAuth } from './middleware.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ymedia_secret_key_2026';

// ==========================================
// AUTHENTICATION APIs
// ==========================================

// POST /api/auth/register
router.post('/auth/register', async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: 'All fields (name, username, email, password) are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check unique username
    const existingUsername = await db.users.findOne({ username: username.toLowerCase().trim() });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    // Check unique email
    const existingEmail = await db.users.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await db.users.create({
      name: name.trim(),
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      bio: '',
      profilePicture: '',
      coverBanner: '',
      followers: [],
      following: []
    });

    // Generate token
    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        bio: newUser.bio,
        profilePicture: newUser.profilePicture,
        coverBanner: newUser.coverBanner,
        followers: newUser.followers,
        following: newUser.following
      }
    });
  } catch (err) {
    console.error('Register API Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required.' });
    }

    const term = usernameOrEmail.toLowerCase().trim();
    let user = await db.users.findOne({ username: term });
    if (!user) {
      user = await db.users.findOne({ email: term });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profilePicture: user.profilePicture,
        coverBanner: user.coverBanner,
        followers: user.followers,
        following: user.following
      }
    });
  } catch (err) {
    console.error('Login API Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/auth/profile
router.get('/auth/profile', requireAuth, async (req: any, res) => {
  try {
    const user = await db.users.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({ user });
  } catch (err) {
    console.error('Get Profile Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/auth/profile (Update profile)
router.put('/auth/profile', requireAuth, async (req: any, res) => {
  try {
    const { name, username, bio, profilePicture, coverBanner, password } = req.body;
    const currentId = req.userId;

    const updateFields: any = {};
    if (name) updateFields.name = name.trim();
    if (bio !== undefined) updateFields.bio = bio;
    if (profilePicture !== undefined) updateFields.profilePicture = profilePicture;
    if (coverBanner !== undefined) updateFields.coverBanner = coverBanner;

    if (username) {
      const cleanUsername = username.toLowerCase().trim();
      const existing = await db.users.findOne({ username: cleanUsername });
      if (existing && existing._id.toString() !== currentId) {
        return res.status(400).json({ error: 'Username is already taken.' });
      }
      updateFields.username = cleanUsername;
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }
      updateFields.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await db.users.findByIdAndUpdate(currentId, updateFields);
    return res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (err) {
    console.error('Update Profile Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// ==========================================
// USER RELATED APIs
// ==========================================

// GET /api/users/search
router.get('/users/search', requireAuth, async (req, res) => {
  try {
    const q = (req.query.q || '') as string;
    if (!q) {
      return res.json({ users: [] });
    }

    // Search by username or name
    const allUsers = await db.users.find();
    const filtered = allUsers.filter(u => 
      u.name.toLowerCase().includes(q.toLowerCase()) || 
      u.username.toLowerCase().includes(q.toLowerCase())
    );

    return res.json({ users: filtered });
  } catch (err) {
    console.error('Search Users Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/users (Suggested Users)
router.get('/users', requireAuth, async (req: any, res) => {
  try {
    const currentId = req.userId;
    const currentUser = await db.users.findById(currentId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const allUsers = await db.users.find();
    // Exclude current user and users they already follow
    const suggested = allUsers.filter(u => 
      u._id.toString() !== currentId && 
      !currentUser.following.includes(u._id.toString())
    ).slice(0, 5);

    return res.json({ users: suggested });
  } catch (err) {
    console.error('Get Suggested Users Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/users/:id
router.get('/users/:id', requireAuth, async (req, res) => {
  try {
    const user = await db.users.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Fetch user posts
    const userPosts = await db.posts.find({ user: user._id.toString() });

    return res.json({
      user,
      posts: userPosts,
      postsCount: userPosts.length
    });
  } catch (err) {
    console.error('Get User by ID Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/users/follow/:id
router.put('/users/follow/:id', requireAuth, async (req: any, res) => {
  try {
    const targetId = req.params.id;
    const currentId = req.userId;

    if (targetId === currentId) {
      return res.status(400).json({ error: 'You cannot follow yourself.' });
    }

    const targetUser = await db.users.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found.' });
    }

    await db.users.followToggle(currentId, targetId, true);

    // Create Notification
    await db.notifications.create({
      sender: currentId,
      receiver: targetId,
      type: 'follow'
    });

    return res.json({ message: 'User followed successfully.' });
  } catch (err) {
    console.error('Follow User Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/users/unfollow/:id
router.put('/users/unfollow/:id', requireAuth, async (req: any, res) => {
  try {
    const targetId = req.params.id;
    const currentId = req.userId;

    const targetUser = await db.users.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found.' });
    }

    await db.users.followToggle(currentId, targetId, false);

    return res.json({ message: 'User unfollowed successfully.' });
  } catch (err) {
    console.error('Unfollow User Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// ==========================================
// POST APIs
// ==========================================

// GET /api/posts (Home Feed - global feed or from followed users)
router.get('/posts', requireAuth, async (req: any, res) => {
  try {
    const currentId = req.userId;
    const currentUser = await db.users.findById(currentId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Get all posts (or you could filter by following, but standard practice for a starting app is a global timeline with following highlighted)
    const allPosts = await db.posts.find();
    return res.json({ posts: allPosts });
  } catch (err) {
    console.error('Get Feed Posts Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/posts/:id
router.get('/posts/:id', requireAuth, async (req, res) => {
  try {
    const post = await db.posts.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }
    return res.json({ post });
  } catch (err) {
    console.error('Get Post Details Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/posts
router.post('/posts', requireAuth, async (req: any, res) => {
  try {
    const { caption, image } = req.body;
    if (!caption) {
      return res.status(400).json({ error: 'Post caption is required.' });
    }

    const newPost = await db.posts.create({
      user: req.userId,
      caption: caption,
      image: image || '',
      likes: [],
      comments: []
    });

    return res.status(201).json({
      message: 'Post created successfully',
      post: newPost
    });
  } catch (err) {
    console.error('Create Post Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/posts/:id
router.put('/posts/:id', requireAuth, async (req: any, res) => {
  try {
    const postId = req.params.id;
    const currentId = req.userId;
    const { caption, image } = req.body;

    const post = await db.posts.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const postUserId = post.user._id ? post.user._id.toString() : post.user.toString();
    if (postUserId !== currentId) {
      return res.status(403).json({ error: 'Unauthorized. You can only edit your own posts.' });
    }

    const updateFields: any = {};
    if (caption) updateFields.caption = caption;
    if (image !== undefined) updateFields.image = image;

    const updated = await db.posts.findByIdAndUpdate(postId, updateFields);
    return res.json({
      message: 'Post updated successfully',
      post: updated
    });
  } catch (err) {
    console.error('Edit Post Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/posts/:id
router.delete('/posts/:id', requireAuth, async (req: any, res) => {
  try {
    const postId = req.params.id;
    const currentId = req.userId;

    const post = await db.posts.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const postUserId = post.user._id ? post.user._id.toString() : post.user.toString();
    if (postUserId !== currentId) {
      return res.status(403).json({ error: 'Unauthorized. You can only delete your own posts.' });
    }

    await db.posts.deleteOne(postId);
    return res.json({ message: 'Post deleted successfully.' });
  } catch (err) {
    console.error('Delete Post Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/posts/like/:id
router.put('/posts/like/:id', requireAuth, async (req: any, res) => {
  try {
    const postId = req.params.id;
    const currentId = req.userId;

    const post = await db.posts.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const updatedPost = await db.posts.likeToggle(postId, currentId, true);

    // Only notify if liking someone else's post
    const postUserId = post.user._id ? post.user._id.toString() : post.user.toString();
    if (postUserId !== currentId) {
      await db.notifications.create({
        sender: currentId,
        receiver: postUserId,
        type: 'like',
        postId: postId
      });
    }

    return res.json({ message: 'Post liked successfully', post: updatedPost });
  } catch (err) {
    console.error('Like Post Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/posts/unlike/:id
router.put('/posts/unlike/:id', requireAuth, async (req: any, res) => {
  try {
    const postId = req.params.id;
    const currentId = req.userId;

    const post = await db.posts.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const updatedPost = await db.posts.likeToggle(postId, currentId, false);
    return res.json({ message: 'Post unliked successfully', post: updatedPost });
  } catch (err) {
    console.error('Unlike Post Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// ==========================================
// COMMENTS APIs
// ==========================================

// POST /api/comments/:postId
router.post('/comments/:postId', requireAuth, async (req: any, res) => {
  try {
    const postId = req.params.postId;
    const currentId = req.userId;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Comment text is required.' });
    }

    const post = await db.posts.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const updatedPost = await db.posts.addComment(postId, {
      user: currentId,
      comment: comment.trim()
    });

    // Notify author if comment is from someone else
    const postUserId = post.user._id ? post.user._id.toString() : post.user.toString();
    if (postUserId !== currentId) {
      await db.notifications.create({
        sender: currentId,
        receiver: postUserId,
        type: 'comment',
        postId: postId
      });
    }

    return res.status(201).json({
      message: 'Comment added successfully',
      post: updatedPost
    });
  } catch (err) {
    console.error('Add Comment Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/comments/:commentId
// Find the post containing the comment first, verify ownership of comment, and delete
router.delete('/comments/:commentId', requireAuth, async (req: any, res) => {
  try {
    const commentId = req.params.commentId;
    const currentId = req.userId;

    const allPosts = await db.posts.find();
    let targetPost = null;
    let targetComment = null;

    for (const p of allPosts) {
      const foundComment = p.comments.find((c: any) => c._id.toString() === commentId);
      if (foundComment) {
        targetPost = p;
        targetComment = foundComment;
        break;
      }
    }

    if (!targetPost || !targetComment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    const commentUserId = targetComment.user._id ? targetComment.user._id.toString() : targetComment.user.toString();
    const postUserId = targetPost.user._id ? targetPost.user._id.toString() : targetPost.user.toString();

    // Allow deletion if you are the comment author OR the post author
    if (commentUserId !== currentId && postUserId !== currentId) {
      return res.status(403).json({ error: 'Unauthorized. You cannot delete this comment.' });
    }

    const updatedPost = await db.posts.deleteComment(targetPost._id, commentId);
    return res.json({
      message: 'Comment deleted successfully',
      post: updatedPost
    });
  } catch (err) {
    console.error('Delete Comment Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// ==========================================
// NOTIFICATIONS APIs
// ==========================================

// GET /api/notifications
router.get('/notifications', requireAuth, async (req: any, res) => {
  try {
    const list = await db.notifications.find({ receiver: req.userId });
    return res.json({ notifications: list });
  } catch (err) {
    console.error('Get Notifications Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/notifications/read
router.put('/notifications/read', requireAuth, async (req: any, res) => {
  try {
    await db.notifications.markAllAsRead(req.userId);
    return res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Read Notifications Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// ==========================================
// MESSAGES / CHAT APIs
// ==========================================

// GET /api/messages/:userId
router.get('/messages/:userId', requireAuth, async (req: any, res) => {
  try {
    const list = await db.messages.find({ user1: req.userId, user2: req.params.userId });
    return res.json({ messages: list });
  } catch (err) {
    console.error('Get Messages Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/messages
router.post('/messages', requireAuth, async (req: any, res) => {
  try {
    const { receiverId, text } = req.body;
    if (!receiverId || !text || !text.trim()) {
      return res.status(400).json({ error: 'Receiver and message text are required.' });
    }

    const newMessage = await db.messages.create({
      sender: req.userId,
      receiver: receiverId,
      text: text.trim()
    });

    return res.status(201).json({
      message: 'Message sent successfully',
      messageObj: newMessage
    });
  } catch (err) {
    console.error('Send Message Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
