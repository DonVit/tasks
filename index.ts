import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

const typeDefs = `#graphql

  type Task {
    title: String
    description: String
  }

  type Query {
    tasks: [Task]
  }

`;

const tasks = [
  {
    title: 'Task 1',
    description: 'Task 1 description',
  },
  {
    title: 'Task 2',
    description: 'Task 2 description',
  },
];


const resolvers = {
  Query: {
    tasks: () => tasks,
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);