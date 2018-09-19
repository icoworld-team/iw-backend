import User from "../models/user";
import Pool, { generatePoolName } from "../models/Pool";
import Post, { getPostData, getPostDataForEditResponse } from "../models/Post";
import { formatPoolData, getPoolData } from '../models/Pool';
import Contract from "../models/Contract";
import Comment, {getCommentData} from "../models/Comment";

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

  updateUser: async (_, { input }) => {
    const { id, ...userData } = input;
    const updatedUser = await User.findByIdAndUpdate(id, userData, { new: true });
    return updatedUser;
  },

  deleteUser: async (_, { Id }) => {
    const removed = await User.findByIdAndRemove(Id);
    return removed._id;
  },

  followUser: async (_, { input }) => {
    const { userId, fanId } = input;
    const updatedUser = await User.findByIdAndUpdate(userId, { $push: { subscribers: fanId } });
    const updatedFan = await User.findByIdAndUpdate(fanId, { $push: { follows: userId } });
    return updatedFan._id;
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

  createComment: async (_, { input }) => {
    const { postId } = input;
    const comment = await Comment.create(input) as any;
    const post = await Post.findByIdAndUpdate(postId, { $push: { comments: comment._id } });
    return getCommentData(comment);
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