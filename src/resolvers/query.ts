import {_Profile, _Pools, _Posts, _Comments, _Chats, _Contracts, _News, checkReadPermission} from '../auth/permissions';
import User, { getUserData, getShortUserData } from "../models/user";
import Pool from "../models/Pool";
import { getPoolData, getPoolDataForSearchResult } from '../models/Pool';
import Post, { getPostData } from "../models/Post";
import * as investors from './helpers/investor';
import Contract from "../models/Contract";
import Comment, { getCommentData } from "../models/Comment";
import { getRepostData } from "../models/RePost";
import Chat, { formatChatDataWithUnreadMessages } from "../models/Chat";
import Message, { formatMessageData } from "../models/Message";
import RePost from "../models/RePost";
import News, { getNewsData } from "../models/News";
import { sortByValuesDesc } from "../util/common";

// Query methods implementation.
const QueryImpl = {
  getUser: async (_, { userId }, ctx) => {
    checkReadPermission(_Profile, ctx.user.role);
    const user = await User.findById(userId);
    return getUserData(user);
  },

  getPool: async (_, { poolId }, ctx) => {
    checkReadPermission(_Pools, ctx.user.role);
    const pool = await Pool
      .findById(poolId)
      .populate({
        path: 'owner',
        select: 'name'
      });
    return pool ? getPoolData(pool) : null;
  },

  searchPool: async (_, { poolName }, ctx) => {
    checkReadPermission(_Pools, ctx.user.role);
    const pools = await Pool
      .find({ poolName: new RegExp(`.*${poolName}.*`, 'i') })
      .populate({
        path: 'owner',
        select: 'name'
      });
    return pools.map((pool => getPoolDataForSearchResult(pool)));
  },

  getPools: async (_, { userId }, ctx) => {
    checkReadPermission(_Pools, ctx.user.role);
    const user = await User.findById(userId).select('pools') as any;
    const pools = await Pool.find().where('_id').in(user.pools);
    return pools.map((pool => getPoolData(pool)));
  },

  getPost: async (_, { postId }, ctx) => {
    checkReadPermission(_Posts, ctx.user.role);
    const post = await Post
      .findById(postId)
      .populate({
        path: 'userId',
        select: 'name login avatar'
      });
    return post ? getPostData(post) : null;
  },

  searchPost: async (_, { searchText }, ctx) => {
    checkReadPermission(_Posts, ctx.user.role);
    const posts = await Post
      .find({ content: new RegExp(`.*${searchText}.*`, 'i') })
      .populate({
        path: 'userId',
        select: 'name login avatar'
      });
    return posts.map((post => getPostData(post)));
  },

  searchPostInProfile: async (_, { userId, searchText }, ctx) => {
    checkReadPermission(_Posts, ctx.user.role);
    const user = await User.findById(userId).select('posts reposts') as any;
    const posts = await Post.find({ content: new RegExp(`.*${searchText}.*`, 'i') }).where('_id').in(user.posts)
      .populate({
        path: 'userId',
        select: 'name login avatar'
      });    
    const mappedPosts = posts.map(post => getPostData(post));

    const reposts = await RePost.find().where('_id').in(user.reposts).select('_id postId date likes') as any;
    const repsMap:Map<string, any> = getRepostsMap(reposts);
    const ids = Array.from(repsMap.keys());
    const repostedPosts = await Post.find({ content: new RegExp(`.*${searchText}.*`, 'i') }).where('_id').in(ids)
      .populate({
        path: 'userId',
        select: 'name login avatar'
      });
    const mappedReposted = repostedPosts.map(post => getRepostData(post, repsMap.get(post._id.toString())));

    return {
      posts: mappedPosts,
      reposts: mappedReposted
    }
  },

  getReposts: async (_, { userId }, ctx) => {
    checkReadPermission(_Posts, ctx.user.role);
    const user = await User.findById(userId).select('reposts') as any;
    const reposts = await RePost.find().where('_id').in(user.reposts).select('_id postId date likes') as any;
    const repsMap:Map<string, any> = getRepostsMap(reposts);
    const ids = Array.from(repsMap.keys());
    const posts = await Post.find().where('_id').in(ids)
      .populate({
        path: 'userId',
        select: 'name login avatar'
      });
    return posts.map(post => getRepostData(post, repsMap.get(post._id.toString())));
  },

  getFollowsPosts: async (_, { userId }, ctx) => {
    checkReadPermission(_Posts, ctx.user.role);
    const user = await User.findById(userId).select('follows') as any;
    const posts = await Post.find().where('userId').in(user.follows)
    .populate({
      path: 'userId',
      select: 'name login avatar'
    });
    return posts.map(post => getPostData(post));
  },

  getComments: async (_, { postId }, ctx) => {
    checkReadPermission(_Comments, ctx.user.role);
    const post = await Post.findById(postId) as any;
    const comments = await Comment.find().where('_id').in(post.comments)
    .populate({
      path: 'userId',
      select: 'name login avatar'
    }) as any;
    return comments.map((cmt => getCommentData(cmt, cmt.userId.name, cmt.userId.login, cmt.userId.avatar)));
  },

  getInvestors: async (_, { input }, ctx) => {
    checkReadPermission(_Profile, ctx.user.role);
    const { sortBy, ...filterParams } = input;
    const params = investors.generateSearchingParams(filterParams);
    const users = await User
      .find(params)
      .select({ name: 1, subscribers: 1, login: 1, avatar: 1, createdAt: 1 });
    const sorted = investors.sort(users, sortBy);
    return sorted.map(user => investors.format(user));
  },

  getFollows: async (_, { userId }, ctx) => {
    checkReadPermission(_Profile, ctx.user.role);
    const user = await User.findById(userId) as any;
    const users = await User.find().where('_id').in(user.follows)
      .select('name login avatar');
    return users.map((usr => getShortUserData(usr)));
  },

  getSubscribers: async (_, { userId }, ctx) => {
    checkReadPermission(_Profile, ctx.user.role);
    const user = await User.findById(userId) as any;
    const users = await User.find().where('_id').in(user.subscribers)
      .select('name login avatar');
    return users.map((usr => getShortUserData(usr)));
  },

  getTopUsers: async (_, {flag}, ctx) => {
    checkReadPermission(_Profile, ctx.user.role);
    const users = await User.find({top: flag});
    return users.map((usr => getShortUserData(usr)));
  },

  isTopUser: async (_, { userId }, ctx) => {
    checkReadPermission(_Profile, ctx.user.role);
    const user = await User.findById(userId).select('top') as any;
    return user ? user.top : false;
  },

  getContracts: async (_, { input }, ctx) => {
    checkReadPermission(_Contracts, ctx.user.role);
    const { name, description, address } = input;
    const params = {} as any;
    if (name !== undefined) {
      params.name = new RegExp(`.*${name}.*`, 'i');
    }
    if (description !== undefined) {
      params.description = new RegExp(`.*${description}.*`, 'i');
    }
    const contracts = await Contract.find(params);
    return contracts;
  },

  getChats: async (_, { userId }, ctx) => {
    checkReadPermission(_Chats, ctx.user.role);
    const user = await User.findById(userId) as any;
    const chats = await Chat.find().where('_id').in(user.chats)
      .populate({
        path: 'members',
        select: 'name avatar'
      })
      .populate({
        path: 'messages',
        select: 'userId content read date',
        populate: {
          path: 'userId',
          select: 'name avatar'
        } 
      }) as any;

    const result = chats
      .map(chat => {
        const { _id, members, messages } = chat;
        let resultMessages;
        let countUnreadMessages;
        const sortedMessages = [...messages].sort((a, b) => b.date - a.date);
        let unreadMessages = sortedMessages.filter(message => !message.read);
        if (unreadMessages.length !== 0) {
          resultMessages = unreadMessages;
          countUnreadMessages = unreadMessages.length;
        } else {
          resultMessages = [sortedMessages[0]];
          countUnreadMessages = 0;
        }
        return {
          _id,
          members,
          messages: resultMessages,
          countUnreadMessages
        }
      })
      .map(chat => formatChatDataWithUnreadMessages(chat, userId));

    return result;
  },

  getChatMessages: async (_ , { input }, ctx) => {
    checkReadPermission(_Chats, ctx.user.role);
    const { chatId, skip } = input;
    const limit = 20;
    const chat = await Chat.findById(chatId) as any;
    const messages = await Message.find().where('_id').in(chat.messages)
      .populate({
        path: 'userId',
        select: 'name'
      })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);
    
    const countMessages = await Message.find().where('_id').in(chat.messages).countDocuments();
    const nextMessages = (skip + messages.length) < countMessages;

    return {
      nextMessages,
      messages: messages.map(message => formatMessageData(message))
    };
  },

  searchChat: async (_, { userId, searchText }, ctx) => {
    checkReadPermission(_Chats, ctx.user.role);
    const chats = await this.default.getChats(null, { userId });
    const filteredChats = chats.filter(chat => {
      const regexp = new RegExp(`.*${searchText}.*`, 'i');
      return regexp.test(chat.parnter.name);
    });
    return filteredChats;
  },

  getNews: async (_, {}, ctx) => {
    checkReadPermission(_News, ctx.user.role);
    const news = await News.find();
    return news.map(newsItem => getNewsData(newsItem));
  },

  getPopularTags: async (_, { from, to }, ctx) => {
    checkReadPermission(_News, ctx.user.role);
    const posts = await Post.find().where('createdAt').gte(from).lt(to).select('tags') as any;
    const res = new Map();
    posts.forEach(post => {
      post.tags.forEach(tag => {
        let num:number = res.get(tag);
        res.set(tag, (num) ? num + 1 : 1);
      });  
    });
    const sres = new Map([...res].sort(sortByValuesDesc));
    return sres.keys();
  },  
}

function getRepostsMap(reposts:Array<any>):Map<string,any> {
  const repsMap = new Map();
    for(const repost of reposts){
      const value = {
        id: repost._id,
        date: repost.date,
        likes: repost.likes
      }
      repsMap.set(repost.postId.toString(), value);
    };
  return repsMap;
}

export default QueryImpl;
