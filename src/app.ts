import * as Koa from 'koa';
import * as session from 'koa-session';
import * as passport from 'koa-passport';
import * as Router from 'koa-router';
import * as bodyParser from 'koa-bodyparser';
import * as serve from 'koa-static';
import * as cors from 'koa2-cors';
import { STATIC_ROOT, SESSION_KEYS, SESSION_TIMEOUT, UPLOAD_MAX_SIZE, UPLOAD_MAX_FILES, DEV_MODE } from './util/config';
import { Strategy as LocalStrategy } from 'passport-local'
import { IWError } from './util/IWError';
import { hash, verify } from './auth/digest';
import User, { setUserRole, getUserData } from './models/user';
import admin from './admin';
import { generateConfirmationUrl, generateEmailBody, sendMail } from './confirmEmail';
import { decrypt } from './confirmEmail/helpers';
import { updateConfirmationStatus } from './confirmEmail/confirmation';

// Initialize of Koa application.
const app = new Koa();
const router = new Router();

app.use(serve(STATIC_ROOT));
app.use(bodyParser());

// cors
app.use(cors({
    exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
    maxAge: 5,
    credentials: true,
    allowMethods: ['GET', 'POST', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

// Coockie sign keys.
app.keys = [SESSION_KEYS];
const CONFIG = {
    key: 'sess:key',  /** (string) cookie key */
    maxAge: SESSION_TIMEOUT, /** (number) maxAge in ms (default is 1 days) */
    overwrite: true,  /** (boolean) can overwrite or not (default true) */
    httpOnly: true,   /** (boolean) httpOnly or not (default true) */
    signed: true,     /** (boolean) signed or not (default true) */
    rolling: false,   /** (boolean) Force a session identifier cookie to be set on every response. The expiration is reset to the original maxAge, resetting the expiration countdown. (default is false) */
    renew: false,     /** (boolean) renew session when session is nearly expired, so we can always keep user logged in. (default is false)*/
};
app.use(session(CONFIG, app));

app.use(passport.initialize());
app.use(passport.session());

// app.use(async (ctx, next) => {
//     console.log('session')
//     console.log(ctx.session)
//     await next();
// });

// Allow only authenticated users perform requests for graphql
app.use(async (ctx, next) => {
    if (!DEV_MODE && ctx.path === '/graphql' && ctx.isUnauthenticated()) {
        ctx.throw(401, 'Unauthorized access');
    }
    await next();
});

// Passport setup.
passport.serializeUser((user: any, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (userId: any, done) => {
    try {
        const user = await User.findById(userId);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

passport.use('local-signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true,
},
    async function (ctx, email, password, done) {
        const { firstName, lastName, login } = ctx.body;
        try {
            const userData = {
                name: `${firstName} ${lastName}`,
                login,
                email,
                pwd: await hash(password)
            };
            const user = await User.create(userData);
            user.save();
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }
));

passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
},
    async (email, password, done) => {
        try {
            const user = await User.findOne({ email }) as any;
            // Check an user.
            if (!user) {
                throw new IWError(410, `Cannot find user with email: ${email}`);
            }
            const valid = await verify(password, user.pwd);
            if (!valid) {
                throw new IWError(403, `Incorrect password for user: ${user.name}`);
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    })
);

// Signup request handler.
router.post('/signup', async (ctx, next) => {
    await passport.authenticate('local-signup', async (err, user) => {
        if (err) {
            const { message } = err;
            ctx.body = { error: message };
        } else {
            await ctx.login(user);
            setUserRole(user);
            ctx.body = getUserData(user);

            // sending confirmation email
            const confirmEmailUrl = generateConfirmationUrl(user._id.toString());
            // console.log('confirmEmailUrl', confirmEmailUrl)
            const emailBody = generateEmailBody(confirmEmailUrl);
            // console.log('emailBody', emailBody)
            const result = await sendMail(user.email, emailBody);
            // console.log('result')
            // console.log(result)
            updateConfirmationStatus(user._id, 'sendedConfirmation');
        }
    })(ctx, next);
});

// Login request handler.
router.post('/login', async (ctx, next) => {
    await passport.authenticate('local-login', async (err, user) => {
        if (err) {
            const { message, status } = err;
            ctx.body = { error: message };
            ctx.status = Number.parseInt(status);
        } else if (!user) {
            ctx.body = { error: 'Incorrect password' };
        } else {
            await ctx.login(user);
            ctx.body = getUserData(user);
        }
    })(ctx, next);
});

// Logout request handler.
router.get('/logout', async (ctx) => {
    await ctx.logout();
    ctx.body = 'logout';
});

router.get('/confirmEmail/:hash', (ctx) => {
    const { params: { hash } } = ctx;
    // console.log('hash', hash);
    const SECRET = 'secret' // process.env.EMAIL_SECRET;
    // console.log('SECRET', SECRET)
    const userId = decrypt(SECRET, hash);
    // console.log('userId', userId);
    updateConfirmationStatus(userId, 'confirmed');
    ctx.body = 'Your email has been confirmed!';
});


router.get('/', async (ctx: Koa.Context) => {
    ctx.body = 'icoWorld'
})

// admin api
app.use(admin);

app.use(router.routes());

export default app;