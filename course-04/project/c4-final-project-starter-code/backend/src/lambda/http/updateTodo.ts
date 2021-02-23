import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import * as AWS  from 'aws-sdk'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'
import * as middy from 'middy'
import { cors } from 'middy/middlewares';


const client = new AWS.DynamoDB.DocumentClient();
const todosTable = process.env.TODOS_TABLE;
const logger = createLogger('update Todo');


export const handler= middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  
  const todoId = event.pathParameters.todoId
 // const todoId= 'f5020599-a550-4a9f-afdf-724effcaa062';
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  logger.info(`update todo items with id ${todoId}`);
  const userId = getUserId(event);
 // const userId= 'google-oauth2|103198425751808458594';
  // TODO: Update a TODO item with the provided id using values in the "updatedTodo" object
  const result =await client.update({
    TableName: todosTable,
    Key: { 
      userId: userId , 
      todoId: todoId
       },
       UpdateExpression: 
       'set #name = :name, #dueDate = :dueDate, #done = :done',
   ExpressionAttributeValues: {
       ':name': updatedTodo.name,
       ':dueDate': updatedTodo.dueDate, 
       ':done': updatedTodo.done
   }, 
   ExpressionAttributeNames: {
       '#name': 'name', 
       '#dueDate': 'dueDate', 
       '#done': 'done'
   }}).promise();

return {
  statusCode: 200,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true
  },
  body: JSON.stringify(result)
}
})
handler.use(
  cors({
    credentials: true
  })
)