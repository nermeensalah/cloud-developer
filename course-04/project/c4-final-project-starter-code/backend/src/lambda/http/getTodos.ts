import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda'
import * as AWS  from 'aws-sdk'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'
import * as middy from 'middy'
import { cors } from 'middy/middlewares';
import { TodoItem } from '../../models/TodoItem'

const client = new AWS.DynamoDB.DocumentClient();
const todosTable = process.env.TODOS_TABLE;
// const indexTable=process.env.INDEX_NAME;
const logger = createLogger('Get Todo');


export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // TODO: Get all TODO items for a current user
  console.log('Processing event: ', event);
  logger.info('retrive todo items');

  const userId = getUserId(event);
  
  const result = await client.query({ 
    TableName: todosTable, // name of base table
    KeyConditionExpression: 'userId = :userId', 
    ExpressionAttributeValues: { ':userId': userId },
  }).promise();

  const items = result.Items as TodoItem[]
logger.info('List of item:'+ items);
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      items
    })
  }
 
})

handler.use(
  cors({
    credentials: true
  })
)
