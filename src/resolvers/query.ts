import User, { getUserData, getShortUserData } from "../models/user";
import Pool from "../models/Pool";
import { getPoolData, getPoolDataForSearchResult } from '../models/Pool';
import Post, { getPostData } from "../models/Post";
import * as investorHelpers from './helpers/investor';
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
    const user = await User.findById(userId).select('pools') as any;
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

  searchPost: async (_, { searchText }) => {
    const posts = await Post
      .find({ content: new RegExp(`.*${searchText}.*`, 'i') })
      .populate({
        path: 'userId',
        select: 'name login'
      });
    return posts.map((post => getPostData(post)));
  },

  searchPostInProfile: async (_, { userId, searchText }) => {
    const user = await User.findById(userId).select('posts reposts') as any;
    const posts = await Post.find({ content: new RegExp(`.*${searchText}.*`, 'i') }).where('_id').in(user.posts)
      .populate({
        path: 'userId',
        select: 'name login'
      });    
    const mappedPosts = posts.map(post => getPostData(post));

    const reposts = await RePost.find().where('_id').in(user.reposts).select('_id postId date likes') as any;
    const repsMap:Map<string, any> = getRepostsMap(reposts);
    const ids = Array.from(repsMap.keys());
    const repostedPosts = await Post.find({ content: new RegExp(`.*${searchText}.*`, 'i') }).where('_id').in(ids)
      .populate({
        path: 'userId',
        select: 'name login'
      });
    const mappedReposted = repostedPosts.map(post => getRepostData(post, repsMap.get(post._id.toString())));

    return {
      posts: mappedPosts,
      reposts: mappedReposted
    }
  },

  getReposts: async (_, { userId }) => {
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

  getFollowsPosts: async (_, { userId }) => {
    const user = await User.findById(userId).select('follows') as any;
    const posts = await Post.find().where('userId').in(user.follows)
    .populate({
      path: 'userId',
      select: 'name login avatar'
    });
    return posts.map(post => getPostData(post));
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
    const investors = await User
      .find(searchingParamsObject)
      .select({ name: 1, subscribers: 1, login: 1, createdAt: 1 });
    const sortedInvestors = investorHelpers.sortInvestors(investors, sortBy);
    const formattedInvestors = sortedInvestors.map(investor => investorHelpers.formatInvestor(investor));
    return formattedInvestors;
  },

  getFollows: async (_, { userId }) => {
    const user = await User.findById(userId) as any;
    const users = await User.find().where('_id').in(user.follows)
      .select('name login avatar');
    return users.map((usr => getShortUserData(usr)));
  },

  getSubscribers: async (_, { userId }) => {
    const user = await User.findById(userId) as any;
    const users = await User.find().where('_id').in(user.subscribers)
      .select('name login avatar');
    return users.map((usr => getShortUserData(usr)));
  },

  getTopUsers: async (_, {flag}) => {
    const users = await User.find({top: flag});
    return users.map((usr => getShortUserData(usr)));
  },

  isTopUser: async (_, { userId }) => {
    const user = await User.findById(userId).select('top') as any;
    return user ? user.top : false;
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
      }) as any;

    const result = chats
      .map(chat => {
        const { _id, members, messages } = chat;
        const unreadMessages = messages
          .filter(message => !message.read)
          .sort((a, b) => b.date - a.date);
        return {
          _id,
          members,
          unreadMessages,
          countUnreadMessages: unreadMessages.length
        }
      })
      .map(chat => formatChatDataWithUnreadMessages(chat, userId));

    return result;
  },

  getChatMessages: async (_ , { input }) => {    
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

  searchChat: async (_, { userId, searchText }) => {
    const chats = await this.default.getChats(null, { userId });
    const filteredChats = chats.filter(chat => {
      const regexp = new RegExp(`.*${searchText}.*`, 'i');
      return regexp.test(chat.parnter.name);
    });
    return filteredChats;
  },

  getNews: async () => {
    const news = await News.find();
    return news.map(newsItem => getNewsData(newsItem));
  },

  getPopularTags: async (_, { from, to }) => {
    const posts = await Post.find().where('createdAt').gte(from).lt(to).select('tags') as any;
    const res = new Map();
    posts.array.forEach(tags => {
      tags.array.forEach(tag => {
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
