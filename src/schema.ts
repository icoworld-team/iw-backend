import QueryImpl from './resolvers/query';
import MutationImpl from './resolvers/mutation';
import { gql, Config } from "apollo-server";

// Query definition.
const Query = gql(`
    type Query {
        getUser(userId: ID!): User
        getFollows(userId: ID!): [User]!
        getSubscribers(userId: ID!): [User]!
        getTopUsers(flag: Boolean!): [User]!
        isTopUser(userId: ID!): Boolean!
        getPool(poolId: ID!): Pool
        getPools(userId: ID!): [Pool]!
        searchPool(poolName: String!): [PoolInfo!]!
        getPost(postId: ID!): Post
        searchPost(searchText: String!): [Post!]!
        searchPostInProfile(userId: ID!, searchText: String!): SearchPostInProfileResponse!
        getReposts(userId: ID!): [Post]!
        getFollowsPosts(userId: ID!): [Post]!
        getComments(postId: ID!): [Comment]!
        getInvestors(input: InvestorsFilterParamsInput!): [Investor!]!
        getContracts(input: ContractsParamsInput!): [Contract]!
        getChats(userId: ID!): [Chat!]!
        getChatMessages(input: ChatInput!): [Message!]!
        searchChat(userId: ID!, searchText: String!): [Chat!]!
        getNews: [News!]!
        getPopularTags(from: String!, to: String!): [String]
    }
`);

// Mutation definition.
const Mutation = gql(`
    type Mutation {
        uploadFile(userId: ID!, file: Upload!): ID!
        addWallet(userId:ID!, addr:String!): ID!
        removeWallet(userId:ID!, id:ID!): Boolean!
        addEducation(userId: ID!, input: ExpirienceInput!): ID!
        updateEducation(userId: ID!, id: ID! input: ExpirienceInput!): Boolean!
        removeEducation(userId:ID!, id:ID!): Boolean!
        addJob(userId: ID!, input:ExpirienceInput!): ID!
        updateJob(userId: ID!, id: ID! input: ExpirienceInput!): Boolean!
        removeJob(userId:ID!, id:ID!): Boolean!
        updateUser(input: UserInput!): User!
        deleteUser(id: ID!): ID!
        followUser(userId: ID!, fanId: ID!): ID!
        unfollowUser(userId: ID!, fanId: ID!): Boolean!
        setPMSendersMode(userId: ID!, mode: String!): Boolean!
        setCommentersMode(userId: ID!, mode: String!): Boolean!
        makeTopUser(userId: ID!, flag: Boolean!): Boolean!
        createPool(input: PoolInput!): PoolCreateResponse!
        createPost(input: PostInput!): Post!
        editPost(input: PostEditInput!): PostEditResponse!
        deletePost(postId: ID!): ID!
        likePost(input: PostLikeInput!): Int!
        rePost(userId: ID!, postId: ID!): Int!
        likeRePost(id: ID!,  userId: ID!, like: Boolean!): Int!
        deleteRePost(id: ID!): Boolean!
        addImage(postId: ID, imageId: ID): Boolean!
        removeImage(postId: ID, imageId: ID, del: Boolean): Boolean!
        createComment(input: CommentInput!): Comment!
        editComment(input: CommentEditInput!): ID!
        deleteComment(cmtId: ID!): ID!
        createContract(input: ContractInput!): ID!
        deleteContract(id: ID!): ID!
        createNews(title: String!): ID!
        deleteNews(newsId: ID!): ID!
    }
`);

// Types definition.
const Types = gql(`
    type File {
        filename: String!
        mimetype: String!
        encoding: String!
    }

    type Wallet {
        id: ID!
        kind: String!
        address: String
    }

    type Expirience {
        id: ID!
        name: String!
        from: String!
        to: String
    }

    type Clinks {
        fb: String
        linkedin: String
        instagram: String
        twitter: String
        telegram: String
        wechat: String
    }

    type User {
        id: ID!
        name: String!
        login: String
        email: String!
        phone: String
        country: String
        city: String
        site: String
        clinks: Clinks
        educations: [Expirience]
        jobs: [Expirience]
        wallets: [Wallet]
        notifications: Boolean
        pmsenders: String!
        commenters: String!
        twoFactorAuth: Boolean
        top: Boolean!
        verified: Boolean!
        about: String
        language: String
    }

    input ExpirienceInput {
        name: String!
        from: String!
        to: String
    }

    input CLinksInput {
        fb: String
        linkedin: String
        instagram: String
        twitter: String
        telegram: String
        wechat: String
    }

    input UserInput {
        id: ID!
        login: String
        name: String
        email: String
        phone: String
        photo: ID
        avatar: ID
        country: String
        city: String
        site: String
        clinks: CLinksInput
        notifications: Boolean
        twoFactorAuth: Boolean
        about: String
        language: String
    }

    input PoolInput {
        owner: ID!
        projectName: String!
        projectLink: String!
        projectAdress: String!
        poolSoftCap: Float!
        poolHardCap: Float!
        minDeposit: Float!
        maxDeposit: Float!
        endDate: String!
        ownerComission: Float!
        comissionPaymentAddress: String!
        iwComission: Float!
    }

    type Pool {
        poolId: String!
        poolName: String!
        status: Int!
        ownerId: ID!
        ownerName: String!
        projectName: String!
        projectAdress: String!
        poolSoftCap: Float!
        poolHardCap: Float!
        minDeposit: Float!
        maxDeposit: Float!
        endDate: String!
        ownerComission: Float!
        iwComission: Float!
    }

    type PoolCreateResponse {
        poolId: ID!
        poolName: String!
    }

    type PoolInfo {
        poolId: String!
        poolName: String!
        ownerId: ID!
        ownerName: String!
        projectName: String!
        endDate: String!
    }

    input PostInput {
        userId: ID!
        content: String!
        tags: [String!]
    }
    
    type Post {
        postId: ID!
        userId: ID!
        userName: String!
        userLogin: String
        date: String
        edited: String
        content: String!
        comments: [ID]
        likes: [ID]
        tags: [String!]!
        attachments: [ID]
    }

    type PostEditResponse {
        postId: ID!
        userId: ID!
        date: String
        content: String!
        tags: [String!]!
    }
    
    input PostEditInput {
        postId: ID!,
        content: String!
        tags: [String!]
    }

    input PostLikeInput {
        userId: ID!
        postId: ID!
        like: Boolean!
    }

    type RepostLike {
        name: String!
        login: String
    }

    type Repost {
        postId: ID!
        userId: ID!
        userName: String!
        userLogin: String
        date: String
        edited: String
        content: String!
        tags: [String!]!
        reposted: String
        likes: [RepostLike]
    }

    type SearchPostInProfileResponse {
        posts: [Post!]!
        reposts: [Repost!]!
    }

    type Comment {
        Id: ID!
        userId: ID!
        postId: ID!
        userName: String!
        userLogin: String
        date: String!
        edited: String!
        content: String!
    }

    input CommentInput {
        userId: ID!
        postId: ID!
        content: String!
    }

    input CommentEditInput {
        cmtId: ID!
        content: String!
    }

    input InvestorsFilterParamsInput {
        name: String
        country: String
        followersRangeFilter: FollowersRangeFilter
        sortBy: SORTING_PARAMS
    }

    input FollowersRangeFilter {
        from: Int
        to: Int
    }

    enum SORTING_PARAMS {
        REGISTRATION_DATE
        NUMBER_OF_FOLLOWERS
        CAPITAL_AMOUNT
        PROFIT_LEVEL
        PERCENTAGE_OF_PROFITABLE_INVESTMENTS
    }

    type Investor {
        id: ID!
        name: String!
        login: String
        countOfFollowers: Int!
    }

    type Contract {
        id: ID!
        name: String!
        description: String
        src: String!
        abi: String!
        bin: String!
    }

    input ContractInput {
        name: String!
        description: String
        src: String!
        abi: String!
        bin: String!
    }

    input ContractsParamsInput {
        name: String
        description: String
    }

    type ChatUserData {
        id: ID!
        name: String!
    }

    type Message {
        id: ID!
        author: ChatUserData!
        content: String!
        read: Boolean!
        date: String!
    }

    type Chat {
        chatId: ID!
        parnter: ChatUserData!
        lastMessage: Message!
    }

    input ChatInput {
        chatId: ID!
        skip: Int!
    }

    type News {
        id: ID!
        title: String!
        date: String!
    }
`);

// Construct a config which contains typedefs and resolvers.
const config: Config = {
    typeDefs: [
        Query, Mutation, Types
    ],
    resolvers: {
        Query: QueryImpl,
        Mutation: MutationImpl
    },
};

export default config;