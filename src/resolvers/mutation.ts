import User from "../models/user";
import Pool, { generatePoolName } from "../models/Pool";
import Post, { getPostData, getPostDataForEditResponse } from "../models/Post";
import { formatPoolData, getPoolData } from '../models/Pool';
import Contract from "../models/Contract";
import Comment, {getCommentData} from "../models/Comment";
import Wallet from "../models/Wallet";
import RePost from "../models/RePost";

// Verify contract URL.
const verifyContractLink = process.env.ETH_VERIFY_CONTRACT_URL || 'https://etherscan.io/verifyContract';

// Mutation methods implementation.
const MutationImpl = {
  /* createUser: async (parent, args) => {
    const user = await new User(args);
    user.save();
    user._id = user._id.toString();
    return user;
  },
 */

  /* upload: async (parent, { file }) => {
      const { stream, filename, mimetype, encoding } = await file;

      // 1. Validate file metadata.

      // 2. Record the file upload in your DB.
      // const id = await recordFile( … )

      return { filename, mimetype, encoding };
  }, */

  addWallet: async (_, { userId, addr}) => {
    const user = await User.findById(userId).select('wallets') as any;
    const wallet = user.wallets.create({address: addr});
    user.wallets.push(wallet);
    return wallet._id;
  },

  removeWallet: async (_, { userId, id}) => {
    const user = await User.findById(userId).select('wallets') as any;
    user.wallets.pull(id);
    return true;
  },

  addEducation: async (_, { input }) => {
    const {userId, name:_name, _from, _to} = input;
    const user = await User.findById(userId).select('educations') as any;
    const obj = user.educations.create({name: _name, from: _from, to: _to});
    user.educations.push(obj);
    return obj._id;
  },

  removeEducation: async (_, { userId, id}) => {
    const user = await User.findById(userId).select('educations') as any;
    user.educations.pull(id);
    return true;
  },

  addJob: async (_, { input }) => {
    const {userId, _name, _from, _to} = input;
    const user = await User.findById(userId).select('jobs') as any;
    const obj = user.jobs.create({name: _name, from: _from, to: _to});
    user.jobs.push(obj);
    return obj._id;
  },

  removeJob: async (_, { userId, id}) => {
    const user = await User.findById(userId).select('jobs') as any;
    user.jobs.pull(id);
    return true;
  },

  updateUser: async (_, { input }) => {
    const { id, ...userData } = input;
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
}

export default MutationImpl;