import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import * as AWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';
import { createLogger } from '../../utils/logger'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { getUserId } from '../utils'

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
const logger = createLogger('uploadTodoUrl');


const XAWS = AWSXRay.captureAWS(AWS);
let options: AWS.S3.Types.ClientConfiguration = {
    signatureVersion: 'v4',
};
const s3 = new XAWS.S3(options);
const bucketName = process.env.ATTACHMENT_S3_BUCKET;
const urlExpiration = parseInt(process.env.SIGNED_URL_EXPIRATION);

function getUploadedUrl(todoId: string): string {
  return s3.getSignedUrl('putObject', {
      Bucket: bucketName,
      Key: todoId,
      Expires: urlExpiration,
  });
}
export const handler= middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  console.log(todoId);
  const userId = getUserId(event);
 
  const uploadUrl = getUploadedUrl(todoId);
  const updatedTodo = {
    url: `https://${bucketName}.s3.amazonaws.com/${todoId}`
  }


await docClient.update({
  TableName: todosTable,
  Key: { 
      todoId: todoId, 
      userId: userId },
  ExpressionAttributeNames: {"#A": "attachmentUrl"},
  UpdateExpression: "set #A = :attachmentUrl",
  ExpressionAttributeValues: {
      ":attachmentUrl": updatedTodo.url,
  },
  ReturnValues: "UPDATED_URL"
}).promise();
logger.info("The url is" +uploadUrl);
return {
  statusCode: 200,
  headers: {
            'Access-Control-Allow-Origin': '*',
             'Access-Control-Allow-Credentials': true
           },
  body: JSON.stringify({
    uploadUrl
  })
}
})


handler.use(
  cors({
    credentials: true
  })
)
