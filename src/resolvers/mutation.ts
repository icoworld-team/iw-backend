import * as path from 'path';
import * as fs from 'fs';
import {STATIC_ROOT} from '../util/config';
import {_Special, _Profile, _Pools, _Posts, _Comments, _Contracts, _News, checkCreatePermission, checkEditPermission, checkDeletePermission, getRole} from '../auth/permissions';
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
    checkCreatePermission(_Profile, getRole(ctx));
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

  addWallet: async (_, { addr}, ctx) => {
    checkCreatePermission(_Profile, getRole(ctx));
    const user = await User.findById(ctx.user._id).select('wallets') as any;
    const wallet = user.wallets.create({address: addr});
    user.wallets.push(wallet);
    user.save();
    return wallet._id;
  },

  removeWallet: async (_, { id}, ctx) => {
    checkDeletePermission(_Profile, getRole(ctx));
    const user = await User.findById(ctx.user._id).select('wallets') as any;
    user.wallets.pull(id);
    user.save();
    return true;
  },

  addEducation: async (_, { input }, ctx) => {
    checkCreatePermission(_Profile, getRole(ctx));
    const user = await User.findById(ctx.user._id).select('educations') as any;
    const obj = user.educations.create(input);
    user.educations.push(obj);
    user.save();
    return obj._id;
  },

  updateEducation: async (_, { id, input }, ctx) => {
    checkEditPermission(_Profile, getRole(ctx));
    const user = await User.findById(ctx.user._id).select('educations') as any;
    const obj = user.educations.id(id);
    obj.set(input);
    user.save();
    return true;
  },

  removeEducation: async (_, { id}, ctx) => {
    checkDeletePermission(_Profile, getRole(ctx));
    const user = await User.findById(ctx.user._id).select('educations') as any;
    user.educations.pull(id);
    user.save();
    return true;
  },

  addJob: async (_, { input }, ctx) => {
    checkCreatePermission(_Profile, getRole(ctx));
    const user = await User.findById(ctx.user._id).select('jobs') as any;
    const obj = user.jobs.create(input);
    user.jobs.push(obj);
    user.save();
    return obj._id;
  },

  updateJob: async (_, { id, input }, ctx) => {
    checkEditPermission(_Profile, getRole(ctx));
    const user = await User.findById(ctx.user._id).select('jobs') as any;
    const obj = user.jobs.id(id);
    obj.set(input);
    user.save();
    return true;
  },

  removeJob: async (_, { id}, ctx) => {
    checkDeletePermission(_Profile, getRole(ctx));
    const user = await User.findById(ctx.user._id).select('jobs') as any;
    user.jobs.pull(id);
    user.save();
    return true;
  },

  setPMSendersMode: async (_, { mode }, ctx) => {
    checkEditPermission(_Profile, getRole(ctx));
    const updated = await User.findByIdAndUpdate(ctx.user._id, { pmsenders: mode });
    return true;
  },

  setCommentersMode: async (_, { mode }, ctx) => {
    checkEditPermission(_Profile, getRole(ctx));
    const updated = await User.findByIdAndUpdate(ctx.user._id, { commenters: mode });
    return true;
  },

  updateUser: async (_, { input }, ctx) => {
    checkEditPermission(_Profile, getRole(ctx));
    const id = ctx.user._id.toString();
    const phone = input['phone'];
    if (phone) {
      const user = await User.findOne({ phone });
      if (user && user._id.toString() !== id) {
        throw new Error(`User with the same phone already exists: ${phone}`);
      }
    }
    const updatedUser = await User.findByIdAndUpdate(id, input, { new: true });
    return updatedUser;
  },

  deleteUser: async (_, { Id }, ctx) => {
    checkDeletePermission(_Profile, getRole(ctx), Id === ctx.user._id.toString());
    const removed = await User.findByIdAndRemove(Id);
    return removed._id;
  },

  followUser: async (_, { userId }, ctx) => {
    checkEditPermission(_Profile, getRole(ctx));
    const fanId = ctx.user._id;
    const updatedUser = await User.findByIdAndUpdate(userId, { $push: { subscribers: fanId } });
    const updatedFan = await User.findByIdAndUpdate(fanId, { $push: { follows: userId } });
    return updatedFan._id;
  },

  unfollowUser: async (_, { userId }, ctx) => {
    checkEditPermission(_Profile, getRole(ctx));
    const fanId = ctx.user._id;
    const updatedUser = await User.findByIdAndUpdate(userId, { $pull: { subscribers: fanId } });
    const updatedFan = await User.findByIdAndUpdate(fanId, { $pull: { follows: userId } });
    return true;
  },

  makeTopUser: async (_, { userId, flag }, ctx) => {
    checkEditPermission(_Special, getRole(ctx));
    const updated = await User.findByIdAndUpdate(userId, { top: flag } );
    return flag;
  },

  createPool: async (_, { input }, ctx) => {
    checkCreatePermission(_Pools, getRole(ctx));
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
    checkCreatePermission(_Posts, getRole(ctx));
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
    checkEditPermission(_Posts, getRole(ctx));
    const { postId, ...postData } = input;
    const updatedPost = await Post.findByIdAndUpdate(postId, postData, { new: true });
    return getPostDataForEditResponse(updatedPost);
  },

  deletePost: async (_, { id }, ctx) => {
    const role = getRole(ctx);
    const post = await Post.findById(id).select('userId') as any;
    const equals = post.userId.toString() === ctx.user._id.toString();
    checkDeletePermission(_Posts, role, equals);
    post.remove();
    return true;
  },

  likePost: async (_, { id, like }, ctx) => {
    checkEditPermission(_Profile, getRole(ctx));
    const updatedPost = like
            ? await Post.findByIdAndUpdate(id, { $push: { likes: ctx.user._id } }, { new: true }) as any
            : await Post.findByIdAndUpdate(id, { $pull: { likes: ctx.user._id } }, { new: true }) as any
    return updatedPost.likes.length;
  },

  pinPost: async (_, {id, pin}, ctx) => {
    checkEditPermission(_Profile, getRole(ctx));
    const update = (pin) 
            ? await User.findByIdAndUpdate(ctx.user._id, {$set:{ pined_post: id }})
            : await User.findByIdAndUpdate(ctx.user._id, {$unset:{ pined_post: "" }});
    return update._id;
  },

  rePost: async (_, { postId }, ctx) => {
    checkEditPermission(_Profile, getRole(ctx));
    const repostData = { userId: ctx.user._id, postId };
    const repost = await RePost.create(repostData);
    const updated = await User.findByIdAndUpdate(ctx.user._id, { $push: { reposts: repost._id } }, { new: true })
      .select('reposts') as any;
    return updated.reposts.length;
  },

  likeRePost: async (_, { id, like }, ctx) => {
    checkEditPermission(_Profile, getRole(ctx));
    const updated = like
            ? await RePost.findByIdAndUpdate(id, { $push: { likes: ctx.user._id } }, { new: true }) as any
            : await RePost.findByIdAndUpdate(id, { $pull: { likes: ctx.user._id } }, { new: true }) as any
    return updated.likes.length;
  },

  deleteRePost: async (_, { id }, ctx) => {
    checkEditPermission(_Profile, getRole(ctx));
    const removed = await RePost.findByIdAndRemove(id);
    return true;
  },

  addImage: async (_, { postId, imageId }, ctx) => {
    checkEditPermission(_Profile, getRole(ctx));
    const post = await Post.findByIdAndUpdate(postId, { $push: { attachments: imageId } });
    return true;
  },

  removeImage: async (_, { postId, imageId, del }, ctx) => {
    checkEditPermission(_Profile, getRole(ctx));
    const post = await Post.findByIdAndUpdate(postId, { $pull: { attachments: imageId } });
    if(del) {
      await Image.findByIdAndRemove(imageId);
    }
    return true;
  },

  createComment: async (_, { postId, content }, ctx) => {
    checkCreatePermission(_Comments, getRole(ctx));
    const comment = await Comment.create({ userId: ctx.user._id, postId, content }) as any;
    const user = await User.findById(ctx.user._id).select({ name: 1, login: 1, avatar: 1 }) as any;
    const post = await Post.findByIdAndUpdate(postId, { $push: { comments: comment._id } });
    return getCommentData(comment, user.name, user.login, user.avatar);
  },

  editComment: async (_, { cmtId, content }, ctx) => {
    checkEditPermission(_Comments, getRole(ctx));
    const updated = await Comment.findByIdAndUpdate(cmtId, content, { new: true });
    return updated._id;
  },

  deleteComment: async (_, { cmtId }, ctx) => {
    checkDeletePermission(_Comments, getRole(ctx));
    const removed = await Comment.findByIdAndRemove(cmtId);
    return removed._id;
  },

  createContract: async (_, { input }, ctx) => {
    checkCreatePermission(_Contracts, getRole(ctx));
    const contract = await Contract.create(input);
    return contract._id;
  },
  
  deployContract: async (_, { name, input }, ctx) => {
    checkEditPermission(_Contracts, getRole(ctx));
    const data = await deployContract(name, input);
    return data;
  },

  deleteContract: async (_, { Id }, ctx) => {
    checkDeletePermission(_Contracts, getRole(ctx));
    const contract = await Contract.findByIdAndRemove(Id);
    return contract._id;
  },

  createNews: async (_, { title }, ctx) => {
    checkCreatePermission(_News, getRole(ctx));
    const createdNews = await News.create({ title });
    return createdNews._id;
  },

  deleteNews: async (_, { newsId }, ctx) => {
    checkDeletePermission(_News, getRole(ctx));
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