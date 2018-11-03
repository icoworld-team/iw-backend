import app from './app';
import { ApolloServer } from 'apollo-server-koa';
import io from './socket'
import schema from './schema';
import database, {close} from './db';

const path = '/graphql';

// Create the server
const server = new ApolloServer({
  ...schema,
  context: (req) => {
    return {
      user: req.ctx.state.user
    }
  }
});
server.applyMiddleware({ app, path });

// Attach the socket to the application
io.attach(app);

let exitTimeout = undefined;
// Cleanup resources.
function cleanup(code:number) {
  if (exitTimeout) {
    return;
  }
  close();
  server.stop();
  console.log('Process will exit in 5 seconds');
  exitTimeout = setTimeout(process.exit, 5000, code);
}
// Setup handlers for various termination signals.
process.on('SIGTERM', () => {
  cleanup(1);
}).on('SIGINT', () => {
  cleanup(2);
}).on('SIGQUIT', () => {
  cleanup(3);
}).on('exit', () => {
  cleanup(0);
});

// Initialize DB connection
const db = database();
db.then(info => {
  // Listen
  const _port = process.env.PORT || 4000;
  app.listen({ port: _port }, () =>
    console.log(`Server listening at http://localhost:${_port}${server.graphqlPath}`),
  );
}).catch((err) => {
  console.error(err);
  cleanup(4);
});
