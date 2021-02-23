import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { createLogger } from '../../utils/logger'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import * as AWS  from 'aws-sdk'
import * as uuid from 'uuid'
import { getUserId } from '../utils'
import { cors } from 'middy/middlewares';
import * as middy from 'middy'

const docClient = new AWS.DynamoDB.DocumentClient()
const TodosTable = process.env.TODOS_TABLE
const logger = createLogger('add Todo');

export const handler = middy( async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
 
  console.log('Processing event: ', event)
  const itemId = uuid.v4();
  const user = getUserId(event);

  const parsedBody:CreateTodoRequest  = JSON.parse(event.body)
  console.log("body: "+parsedBody)
  const newItem = {
    todoId: itemId,
    userId: user,
    ...parsedBody //name, duedate
  }

  await docClient.put({
    TableName: TodosTable,
    Item: newItem
  }).promise()
  logger.info(`create Todo item id ${itemId} for user id ${user}`);
  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      item :{
        ...newItem,
      }
    })
  }
})



handler.use(
  cors({
    credentials: true
  })
)
