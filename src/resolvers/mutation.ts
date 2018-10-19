import * as path from 'path';
import * as fs from 'fs';
import {STATIC_ROOT} from '../util/config';
import {_Special, _Profile, _Pools, _Posts, _Comments, _Contracts, _News, checkCreatePermission, checkEditPermission, checkDeletePermission} from '../auth/permissions';
import User from "../models/user";
import Pool, { generatePoolName } from "../models/Pool";
import Post, { getPostData, getPostDataForEditResponse } from "../models/Post";
import { formatPoolData, getPoolData } from '../models/Pool';
import Contract from "../models/Contract";
import { deployContract } from '../eth/contracts';
import Comment, {getCommentData} from "../models/Comment";
import RePost from "../models/RePost";
import Image from "../models/Image";
import News from "../models/News";

// Upload path value.
const UPLOAD_PATH = path.join(STATIC_ROOT, 'images');

// Mutation methods implementation.
const MutationImpl = {
  /* createUser: async (parent, args) => {
    const user = await new User(args);
    user.save();
    user._id = user._id.toString();
    return user;
  },
 */

  uploadFile: async (_, { file }, ctx) => {
    checkCreatePermission(_Profile, ctx.user.role);
    const { stream, filename, mimetype, encoding } = await file;
    const user = await User.findById(ctx.user);
    const folder = path.join(UPLOAD_PATH, user._id.toString());
    if (await !fs.existsSync(folder)) {
      await fs.mkdirSync(folder);
    }  
    const image = await Image.create({
      userId: user._id,
      name: filename,
      format: mimetype,
      enc: encoding
    });
    const id = await storeFile(stream, image._id.toString(), folder);
    return id;
  },

  addWallet: async (_, { userId, addr}, ctx) => {
    checkCreatePermission(_Profile, ctx.user.role);
    const user = await User.findById(userId).select('wallets') as any;
    const wallet = user.wallets.create({address: addr});
    user.wallets.push(wallet);
    user.save();
    return wallet._id;
  },

  removeWallet: async (_, { userId, id}, ctx) => {
    checkDeletePermission(_Profile, ctx.user.role);
    const user = await User.findById(userId).select('wallets') as any;
    user.wallets.pull(id);
    user.save();
    return true;
  },

  addEducation: async (_, { userId, input }, ctx) => {
    checkCreatePermission(_Profile, ctx.user.role);
    const user = await User.findById(userId).select('educations') as any;
    const obj = user.educations.create(input);
    user.educations.push(obj);
    user.save();
    return obj._id;
  },

  updateEducation: async (_, { userId, id, input }, ctx) => {
    checkEditPermission(_Profile, ctx.user.role);
    const user = await User.findById(userId).select('educations') as any;
    const obj = user.educations.id(id);
    obj.set(input);
    user.save();
    return true;
  },

  removeEducation: async (_, { userId, id}, ctx) => {
    checkDeletePermission(_Profile, ctx.user.role);
    const user = await User.findById(userId).select('educations') as any;
    user.educations.pull(id);
    user.save();
    return true;
  },

  addJob: async (_, { userId, input }, ctx) => {
    checkCreatePermission(_Profile, ctx.user.role);
    const user = await User.findById(userId).select('jobs') as any;
    const obj = user.jobs.create(input);
    user.jobs.push(obj);
    user.save();
    return obj._id;
  },

  updateJob: async (_, { userId, id, input }, ctx) => {
    checkEditPermission(_Profile, ctx.user.role);
    const user = await User.findById(userId).select('jobs') as any;
    const obj = user.jobs.id(id);
    obj.set(input);
    user.save();
    return true;
  },

  removeJob: async (_, { userId, id}, ctx) => {
    checkDeletePermission(_Profile, ctx.user.role);
    const user = await User.findById(userId).select('jobs') as any;
    user.jobs.pull(id);
    user.save();
    return true;
  },

  updateUser: async (_, { input }, ctx) => {
    checkEditPermission(_Profile, ctx.user.role);
    const { id, ...userData } = input;
    const login = userData['login'];
    if (login) {
      const user = await User.findOne({ login });
      if (user && user._id.toString() !== id) {
        throw new Error(`User with the same login already exists: ${login}`);
      }
    }
    const phone = userData['phone'];
    if (phone) {
      const user = await User.findOne({ phone });
      if (user && user._id.toString() !== id) {
        throw new Error(`User with the same phone already exists: ${phone}`);
      }
    }
    const updatedUser = await User.findByIdAndUpdate(id, userData, { new: true });
    return updatedUser;
  },

  deleteUser: async (_, { Id }, ctx) => {
    checkDeletePermission(_Profile, ctx.user.role);
    const removed = await User.findByIdAndRemove(Id);
    return removed._id;
  },

  followUser: async (_, { userId, fanId }, ctx) => {
    checkEditPermission(_Profile, ctx.user.role);
    const updatedUser = await User.findByIdAndUpdate(userId, { $push: { subscribers: fanId } });
    const updatedFan = await User.findByIdAndUpdate(fanId, { $push: { follows: userId } });
    return updatedFan._id;
  },

  unfollowUser: async (_, { userId, fanId }, ctx) => {
    checkEditPermission(_Profile, ctx.user.role);
    const updatedUser = await User.findByIdAndUpdate(userId, { $pull: { subscribers: fanId } });
    const updatedFan = await User.findByIdAndUpdate(fanId, { $pull: { follows: userId } });
    return true;
  },

  setPMSendersMode: async (_, { userId, mode }, ctx) => {
    checkEditPermission(_Profile, ctx.user.role);
    const updated = await User.findByIdAndUpdate(userId, { pmsenders: mode });
    return true;
  },

  setCommentersMode: async (_, { userId, mode }, ctx) => {
    checkEditPermission(_Profile, ctx.user.role);
    const updated = await User.findByIdAndUpdate(userId, { commenters: mode });
    return true;
  },

  makeTopUser: async (_, { userId, flag }, ctx) => {
    checkEditPermission(_Special, ctx.user.role);
    const updated = await User.findByIdAndUpdate(userId, { top: flag } );
    return flag;
  },

  createPool: async (_, { input }, ctx) => {
    checkCreatePermission(_Pools, ctx.user.role);
    // deploy contract
    // save contract's information in db
    const poolName = generatePoolName();
    const poolData = formatPoolData(input);
    const pool = await Pool.create({ ...poolData, poolName, });
    // temporarily return pool object
    return {
      poolId: pool._id,
      poolName
    }
  },

  createPost: async (_, { input: postData }, ctx) => {
    checkCreatePermission(_Posts, ctx.user.role);
    const createdPost = await Post.create(postData);
    await User.findByIdAndUpdate(postData.userId, { $push: { posts: createdPost._id } });
    const post = await Post
      .findById(createdPost._id)
      .populate({
        path: 'userId',
        select: 'name login'
      });
    return getPostData(post);
  },

  editPost: async (_, { input }, ctx) => {
    checkEditPermission(_Posts, ctx.user.role);
    const { postId, ...postData } = input;
    const updatedPost = await Post.findByIdAndUpdate(postId, postData, { new: true });
    return getPostDataForEditResponse(updatedPost);
  },

  deletePost: async (_, { postId }, ctx) => {
    checkDeletePermission(_Posts, ctx.user.role);
    const deletedPost = await Post.findByIdAndRemove(postId);
    return deletedPost._id;
  },

  likePost: async (_, { input }, ctx) => {
    checkEditPermission(_Profile, ctx.user.role);
    const { userId, postId, like } = input;
    const updatedPost = like
            ? await Post.findByIdAndUpdate(postId, { $push: { likes: userId } }, { new: true }) as any
            : await Post.findByIdAndUpdate(postId, { $pull: { likes: userId } }, { new: true }) as any
    return updatedPost.likes.length;
  },

  rePost: async (_, { userId, postId }, ctx) => {
    checkEditPermission(_Profile, ctx.user.role);
    const repostData = { userId, postId };
    const repost = await RePost.create(repostData);
    const updated = await User.findByIdAndUpdate(userId, { $push: { reposts: repost._id } }, { new: true })
      .select('reposts') as any;
    return updated.reposts.length;
  },

  likeRePost: async (_, { id, userId, like }, ctx) => {
    checkEditPermission(_Profile, ctx.user.role);
    const updated = like
            ? await RePost.findByIdAndUpdate(id, { $push: { likes: userId } }, { new: true }) as any
            : await RePost.findByIdAndUpdate(id, { $pull: { likes: userId } }, { new: true }) as any
    return updated.likes.length;
  },

  deleteRePost: async (_, { id }, ctx) => {
    checkEditPermission(_Profile, ctx.user.role);
    const removed = await RePost.findByIdAndRemove(id);
    return true;
  },

  addImage: async (_, { postId, imageId }, ctx) => {
    checkEditPermission(_Profile, ctx.user.role);
    const post = await Post.findByIdAndUpdate(postId, { $push: { attachments: imageId } });
    return true;
  },

  removeImage: async (_, { postId, imageId, del }, ctx) => {
    checkEditPermission(_Profile, ctx.user.role);
    const post = await Post.findByIdAndUpdate(postId, { $pull: { attachments: imageId } });
    if(del) {
      await Image.findByIdAndRemove(imageId);
    }
    return true;
  },

  createComment: async (_, { input }, ctx) => {
    checkCreatePermission(_Comments, ctx.user.role);
    const { userId, postId } = input;
    const comment = await Comment.create(input) as any;
    const user = await User.findById(userId).select({ name: 1, login: 1, avatar: 1 }) as any;
    const post = await Post.findByIdAndUpdate(postId, { $push: { comments: comment._id } });
    return getCommentData(comment, user.name, user.login, user.avatar);
  },

  editComment: async (_, { input }, ctx) => {
    checkEditPermission(_Comments, ctx.user.role);
    const { cmtId, ...data } = input;
    const updated = await Comment.findByIdAndUpdate(cmtId, data, { new: true });
    return updated._id;
  },

  deleteComment: async (_, { cmtId }, ctx) => {
    checkDeletePermission(_Comments, ctx.user.role);
    const removed = await Comment.findByIdAndRemove(cmtId);
    return removed._id;
  },

  createContract: async (_, { input: input }, ctx) => {
    checkCreatePermission(_Contracts, ctx.user.role);
    const contract = await Contract.create(input);
    return contract._id;
  },
  
  deployContract: async (_, { name, input }, ctx) => {
    checkEditPermission(_Contracts, ctx.user.role);
    const data = await deployContract(name, input);
    return data;
  },

  deleteContract: async (_, { Id }, ctx) => {
    checkDeletePermission(_Contracts, ctx.user.role);
    const contract = await Contract.findByIdAndRemove(Id);
    return contract._id;
  },

  createNews: async (_, { title }, ctx) => {
    checkCreatePermission(_News, ctx.user.role);
    const createdNews = await News.create({ title });
    return createdNews._id;
  },

  deleteNews: async (_, { newsId }, ctx) => {
    checkDeletePermission(_News, ctx.user.role);
    const deletedNews = await News.findByIdAndRemove(newsId);
    return deletedNews._id;
  },
}
/**
 * Store file content.
 * @param stream 
 * @param id 
 * @param folder 
 */
async function storeFile(stream, id, folder) {
  const fpath = path.join(folder, id);
  return new Promise((resolve, reject) =>
    stream
      .on('error', error => {
        if (stream.truncated)
          // Delete the truncated file
          fs.unlinkSync(fpath)
        reject(error)
      })
      .pipe(fs.createWriteStream(fpath))
      .on('error', error => reject(error))
      .on('finish', () => resolve(id))
  );
}

export default MutationImpl;