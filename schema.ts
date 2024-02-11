import { tasks } from "./data";

export const typeDefs = `#graphql

  type Task {
    title: String
    description: String
  }

  type Query {
    tasks: [Task]
  }

`;


export const resolvers = {
  Query: {
    tasks: () => tasks,
  },
};

export default undefined
