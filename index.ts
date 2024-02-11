import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { createServer } from 'http';
import express from 'express';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import cors from 'cors';
import { PubSub } from 'graphql-subscriptions';
import bodyParser from 'body-parser';

const pubsub = new PubSub();

pubsub.publish('TASK_CREATED', {
  taskCreated: {
    title: 'Task 3',
    description: 'Task 3 description',
  },
});

export let tasks = [
  {
    title: 'Task 1',
    description: 'Task 1 description',
  },
  {
    title: 'Task 2',
    description: 'Task 2 description',
  },
];

const addTask = newTask => tasks = [...tasks, newTask]

addTask({
  title: 'Task 4',
  description: 'Task 4 description',
})

export const typeDefs = `#graphql

  type Task {
    title: String
    description: String
  }

  type Hello {
    hello: String
  }


  type Task {
    title: String
    description: String
  }

  type Mutation {
    addTask(title: String, description: String): Task
  }

  type Query {
    tasks: [Task]
  }

  type Subscription {
    hello: String
    taskCreated: Task
  }

`;

const resolvers = {
  Subscription: {
    hello: {
      // Example using an async generator
      subscribe: async function* () {
        for await (const word of ['Hello', 'Bonjour', 'Ciao']) {
          yield { hello: word };
        }
      },
    },
    taskCreated: {
      // More on pubsub below
      subscribe: () => pubsub.asyncIterator(['NUMBER_INCREMENTED']),
    },
  },
  Query: {
    tasks: () => tasks,
  },
  Mutation: {
    addTask(parent, {title, description}, arg) {
      // pubsub.publish('POST_CREATED', { postCreated: args }); 
      // return postController.createPost(args);
      addTask({title, description})
      console.error(parent, arg)
      return true
    },
  },
};


// Create the schema, which will be used separately by ApolloServer and
// the WebSocket server.
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Create an Express app and HTTP server; we will attach both the WebSocket
// server and the ApolloServer to this HTTP server.
const app = express();
const httpServer = createServer(app);

// Create our WebSocket server using the HTTP server we just set up.
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});
// Save the returned server's info so we can shutdown this server later
const serverCleanup = useServer({ schema }, wsServer);

// Set up ApolloServer.
const server = new ApolloServer({
  schema,
  plugins: [
    // Proper shutdown for the HTTP server.
    ApolloServerPluginDrainHttpServer({ httpServer }),

    // Proper shutdown for the WebSocket server.
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

await server.start();
// app.use('/graphql', cors<cors.CorsRequest>(), express.json(), expressMiddleware(server));
app.use('/graphql', cors<cors.CorsRequest>(), bodyParser.json(), expressMiddleware(server));

const PORT = 4000;
// Now that our HTTP server is fully set up, we can listen to it.
httpServer.listen(PORT, () => {
  console.log(`Server is now running on http://localhost:${PORT}/graphql`);
});

let currentNumber = 0
// In the background, increment a number every second and notify subscribers when it changes.
function incrementNumber() {
  currentNumber++;
  pubsub.publish('NUMBER_INCREMENTED', { numberIncremented: currentNumber });
  setTimeout(incrementNumber, 1000);
}

// Start incrementing
incrementNumber();
