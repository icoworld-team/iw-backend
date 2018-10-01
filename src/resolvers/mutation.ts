import * as path from 'path';
import * as fs from 'fs';
import {STATIC_ROOT} from '../util/config';
import User from "../models/user";
import Pool, { generatePoolName } from "../models/Pool";
import Post, { getPostData, getPostDataForEditResponse } from "../models/Post";
import { formatPoolData, getPoolData } from '../models/Pool';
import Contract from "../models/Contract";
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

  uploadFile: async (_, { userId, file }) => {
    const { stream, filename, mimetype, encoding } = await file;
    const user = await User.findById(userId);
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
    const fname = image._id.toString();
    const writer = fs.createWriteStream(path.join(folder, fname));
    stream.on('error', (err) => {
      if (err)
        console.log(`Error uploading file <${filename}>: ${err}`);
      writer.close();
    });
    stream.pipe(writer);
    return image._id;
  },

  addWallet: async (_, { userId, addr}) => {
    const user = await User.findById(userId).select('wallets') as any;
    const wallet = user.wallets.create({address: addr});
    user.wallets.push(wallet);
    user.save();
    return wallet._id;
  },

  removeWallet: async (_, { userId, id}) => {
    const user = await User.findById(userId).select('wallets') as any;
    user.wallets.pull(id);
    user.save();
    return true;
  },

  addEducation: async (_, { input }) => {
    const {userId, ...data} = input;
    const user = await User.findById(userId).select('educations') as any;
    const obj = user.educations.create(data);
    user.educations.push(obj);
    user.save();
    return obj._id;
  },

  removeEducation: async (_, { userId, id}) => {
    const user = await User.findById(userId).select('educations') as any;
    user.educations.pull(id);
    user.save();
    return true;
  },

  addJob: async (_, { input }) => {
    const {userId, ...data} = input;
    const user = await User.findById(userId).select('jobs') as any;
    const obj = user.jobs.create(data);
    user.jobs.push(obj);
    user.save();
    return obj._id;
  },

  removeJob: async (_, { userId, id}) => {
    const user = await User.findById(userId).select('jobs') as any;
    user.jobs.pull(id);
    user.save();
    return true;
  },

  updateUser: async (_, { input }) => {
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

  deleteUser: async (_, { Id }) => {
    const removed = await User.findByIdAndRemove(Id);
    return removed._id;
  },

  followUser: async (_, { userId, fanId }) => {
    const updatedUser = await User.findByIdAndUpdate(userId, { $push: { subscribers: fanId } });
    const updatedFan = await User.findByIdAndUpdate(fanId, { $push: { follows: userId } });
    return updatedFan._id;
  },

  unfollowUser: async (_, { userId, fanId }) => {
    const updatedUser = await User.findByIdAndUpdate(userId, { $pull: { subscribers: fanId } });
    const updatedFan = await User.findByIdAndUpdate(fanId, { $pull: { follows: userId } });
    return true;
  },

  addPMSender: async (_, { userId, id }) => {
    const updated = await User.findByIdAndUpdate(userId, { $push: { pmsenders: id } });
    return true;
  },

  removePMSender: async (_, { userId, id }) => {
    const updated = await User.findByIdAndUpdate(userId, { $pull: { pmsenders: id } });
    return true;
  },

  addCommenter: async (_, { userId, id }) => {
    const updated = await User.findByIdAndUpdate(userId, { $push: { commenters: id } });
    return true;
  },

  removeCommenter: async (_, { userId, id }) => {
    const updated = await User.findByIdAndUpdate(userId, { $pull: { commenters: id } });
    return true;
  },

  makeTopUser: async (_, { userId, flag }) => {
    const updated = await User.findByIdAndUpdate(userId, { top: flag } );
    return flag;
  },

  createPool: async (_, { input }) => {
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

  createPost: async (_, { input: postData }) => {
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

  editPost: async (_, { input }) => {
    const { postId, ...postData } = input;
    const updatedPost = await Post.findByIdAndUpdate(postId, postData, { new: true });
    return getPostDataForEditResponse(updatedPost);
  },

  deletePost: async (_, { postId }) => {
    const deletedPost = await Post.findByIdAndRemove(postId);
    return deletedPost._id;
  },

  likePost: async (_, { input }) => {
    const { userId, postId, like } = input;
    const updatedPost = like
            ? await Post.findByIdAndUpdate(postId, { $push: { likes: userId } }, { new: true }) as any
            : await Post.findByIdAndUpdate(postId, { $pull: { likes: userId } }, { new: true }) as any
    return updatedPost.likes.length;
  },

  rePost: async (_, { userId, postId }) => {
    const repostData = { userId, postId };
    const repost = await RePost.create(repostData);
    const updated = await User.findByIdAndUpdate(userId, { $push: { reposts: repost._id } }, { new: true })
      .select('reposts') as any;
    return updated.reposts.length;
  },

  likeRePost: async (_, { id, userId, like }) => {
    const updated = like
            ? await RePost.findByIdAndUpdate(id, { $push: { likes: userId } }, { new: true }) as any
            : await RePost.findByIdAndUpdate(id, { $pull: { likes: userId } }, { new: true }) as any
    return updated.likes.length;
  },

  deleteRePost: async (_, { id }) => {
    const removed = await RePost.findByIdAndRemove(id);
    return true;
  },

  addImage: async (_, { postId, imageId }) => {
    const post = await Post.findByIdAndUpdate(postId, { $push: { attachments: imageId } });
    return true;
  },

  removeImage: async (_, { postId, imageId, del }) => {
    const post = await Post.findByIdAndUpdate(postId, { $pull: { attachments: imageId } });
    if(del) {
      await Image.findByIdAndRemove(imageId);
    }
    return true;
  },

  createComment: async (_, { input }) => {
    const { userId, postId } = input;
    const comment = await Comment.create(input) as any;
    const user = await User.findById(userId).select({ name: 1, login: 1 }) as any;
    const post = await Post.findByIdAndUpdate(postId, { $push: { comments: comment._id } });
    return getCommentData(comment, user.name, user.login);
  },

  editComment: async (_, { input }) => {
    const { cmtId, ...data } = input;
    const updated = await Comment.findByIdAndUpdate(cmtId, data, { new: true });
    return updated._id;
  },

  deleteComment: async (_, { cmtId }) => {
    const removed = await Comment.findByIdAndRemove(cmtId);
    return removed._id;
  },

  createContract: async (_, { input: input }) => {
    const contract = await Contract.create(input);
    return contract._id;
  },
  
  deleteContract: async (_, { Id }) => {
    const contract = await Contract.findByIdAndRemove(Id);
    return contract._id;
  },

  createNews: async (_, { title }) => {
    const createdNews = await News.create({ title });
    return createdNews._id;
  },

  deleteNews: async (_, { newsId }) => {
    const deletedNews = await News.findByIdAndRemove(newsId);
    return deletedNews._id;
  },
}

export default MutationImpl;