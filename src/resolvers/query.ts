import User, { getUserData, getShortUserData } from "../models/user";
import Pool from "../models/Pool";
import { getPoolData, getPoolDataForSearchResult } from '../models/Pool';
import Post, { getPostData } from "../models/Post";
import * as investorHelpers from './helpers/investor';
import * as postHelpers from './helpers/posts'
import Contract from "../models/Contract";
import Comment, { getCommentData } from "../models/Comment";
import { getRepostData } from "../models/RePost";
import Chat, { formatChatData } from "../models/Chat";
import Message, { formatMessageData } from "../models/Message";

// Query methods implementation.
const QueryImpl = {
  getUser: async (_, { userId }) => {
    const user = await User.findById(userId);
    return getUserData(user);
  },

  getPool: async (_, { poolId }) => {
    const pool = await Pool
      .findById(poolId)
      .populate({
        path: 'owner',
        select: 'name'
      });
    return pool ? getPoolData(pool) : null;
  },

  searchPool: async (_, { poolName }) => {
    const pools = await Pool
      .find({ poolName: new RegExp(`.*${poolName}.*`, 'i') })
      .populate({
        path: 'owner',
        select: 'name'
      });
    return pools.map((pool => getPoolDataForSearchResult(pool)));
  },

  getPools: async (_, { userId }) => {
    const user = await User.findById(userId) as any;
    const pools = await Pool.find().where('_id').in(user.pools);
    return pools.map((pool => getPoolData(pool)));
  },

  getPost: async (_, { postId }) => {
    const post = await Post
      .findById(postId)
      .populate({
        path: 'userId',
        select: 'name login'
      });
    return post ? getPostData(post) : null;
  },

  searchPost: async (_, { input }) => {
    const searchingParamsObject = postHelpers.generateSearchingParamsObject(input);

    const posts = await Post
      .find(searchingParamsObject)
      .populate({
        path: 'userId',
        select: 'name login'
      });
    return posts.map((post => getPostData(post)));
  },

  getReposts: async (_, { userId }) => {
    const user = await User.findById(userId) as any;
    const repsMap = new Map();
    user.reposts.forEach(item => {
      repsMap.set(item.postId, item.date);
    });
    const ids = Array.from(repsMap.keys());
    const posts = await Post.find().where('_id').in(ids)
      .populate({
        path: 'userId',
        select: 'name login avatar'
      });
    return posts.map(post => getRepostData(post, repsMap.get(post._id)));
  },

  getComments: async (_, { postId }) => {
    const post = await Post.findById(postId) as any;
    const comments = await Comment.find().where('_id').in(post.comments)
    .populate({
      path: 'userId',
      select: 'name login'
    }) as any;
    return comments.map((cmt => getCommentData(cmt, cmt.userId.name, cmt.userId.login)));
  },

  getInvestors: async (_, { input }) => {
    const { sortBy, ...filterParams } = input;
    const searchingParamsObject = investorHelpers.generateSearchingParamsObject(filterParams);
    const sortingParams = investorHelpers.generateSortingParamsObj(sortBy);
    const investors = await User
      .find(searchingParamsObject)
      .sort(sortingParams)
      .select({ name: 1, follows: 1, login: 1 });

    const formattedInvestors = investors.map(investor => investorHelpers.formatInvestor(investor));
    return formattedInvestors;
  },

  getFollows: async (_, { userId }) => {
    const user = await User.findById(userId) as any;
    const users = await User.find().where('_id').in(user.follows)
      .select({ name: 1, login: 1, avatar: 1, location: 1 });
    return users.map((usr => getShortUserData(usr)));
  },

  getSubscribers: async (_, { userId }) => {
    const user = await User.findById(userId) as any;
    const users = await User.find().where('_id').in(user.subscribers)
      .select({ name: 1, login: 1, avatar: 1, location: 1 });
    return users.map((usr => getShortUserData(usr)));
  },

  getContracts: async (_, { input }) => {
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

  getChats: async (_, { userId }) => {
    const user = await User.findById(userId) as any;
    const chats = await Chat.find().where('_id').in(user.chats)
      .populate({
        path: 'members',
        select: 'name'
      })
      .populate({
        path: 'messages',
        select: 'userId content read date',
        populate: {
          path: 'userId',
          select: 'name'
        } 
      })
      .slice('messages', -1);

    const mappedChats = chats.map(chat => formatChatData(chat, userId));
    return mappedChats;
  },

  getChatMessages: async (_ , { input }) => {    
    const { chatId, skip } = input;
    const limit = 10;
    const chat = await Chat.findById(chatId) as any;
    const messages = await Message.find().where('_id').in(chat.messages)
      .populate({
        path: 'userId',
        select: 'name'
      })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    return messages.map(message => formatMessageData(message));
  }
}

export default QueryImpl;
