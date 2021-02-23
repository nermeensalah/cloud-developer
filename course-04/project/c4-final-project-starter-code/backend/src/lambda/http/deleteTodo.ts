import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares';
import { getUserId } from '../utils';
import * as AWS  from 'aws-sdk';
import { createLogger } from '../../utils/logger'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
const client = new AWS.DynamoDB.DocumentClient();
const todosTable = process.env.TODOS_TABLE;
const logger = createLogger('delete Todo');
export const handler= middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const user = getUserId(event);
  console.log(todoId);
  // TODO: Remove a TODO item by id
  const params = {
    TableName: todosTable,
    Key: {
      todoId, 
      user
    }
  }
  await client.delete(params).promise()
  logger.info("Item"+ params.Key.todoId+"deleted successfully")
return {
  statusCode: 204,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true
  },
  body: ''
}
})



handler.use(
  cors({
    credentials: true
  })
)