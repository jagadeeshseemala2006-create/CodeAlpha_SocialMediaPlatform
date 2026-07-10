export interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  bio: string;
  profilePicture: string;
  coverBanner: string;
  followers: string[];
  following: string[];
  createdAt: string;
}

export interface Comment {
  _id: string;
  user: {
    _id: string;
    name: string;
    username: string;
    profilePicture: string;
  };
  comment: string;
  createdAt: string;
}

export interface Post {
  _id: string;
  user: {
    _id: string;
    name: string;
    username: string;
    profilePicture: string;
  };
  caption: string;
  image: string;
  likes: string[];
  comments: Comment[];
  createdAt: string;
}

export interface Notification {
  _id: string;
  sender: {
    _id: string;
    name: string;
    username: string;
    profilePicture: string;
  };
  receiver: string;
  type: 'like' | 'comment' | 'follow';
  postId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Message {
  _id: string;
  sender: string;
  receiver: string;
  text: string;
  createdAt: string;
}
