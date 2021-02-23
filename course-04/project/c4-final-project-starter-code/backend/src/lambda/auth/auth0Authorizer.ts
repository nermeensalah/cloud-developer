import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify,decode} from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
 import Axios from 'axios'
 import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'


const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
 const jwksUrl = 'https://dev-ojr4z0gl.us.auth0.com/.well-known/jwks.json'
// const secret=process.env.AUTH_0_SECRET



// const cert =`-----BEGIN CERTIFICATE-----
// MIIDDTCCAfWgAwIBAgIJVty2O2hPFeetMA0GCSqGSIb3DQEBCwUAMCQxIjAgBgNV
// BAMTGWRldi1vanI0ejBnbC51cy5hdXRoMC5jb20wHhcNMjAwNzIwMTAxNjUyWhcN
// MzQwMzI5MTAxNjUyWjAkMSIwIAYDVQQDExlkZXYtb2pyNHowZ2wudXMuYXV0aDAu
// Y29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAw+Tqy47n4WuP9x0B
// 0eZjuvI1084OXzlXznLIgQl29LOuQwD0oDqsAYz5fmYlb0NDYE9p157Pz/8xmT5t
// kxnEIav2Fd6SSrQJUj+hqfIxpA9SXEwSYGZXd98I1eOWwQMpaqQ4dgCrfmkZVQ5P
// F8GqGRn0/LtISKU8iB1fHdC2vlDuxlxdjSDcJA3u7D6EQ5XXJC3Kf3IbUIn9xS6A
// kaexlXkNTZl2KaUUgN/zjUpHP73PXjyyK35BUL7Sp9m5SoRGXUD4M0BrOLBdhsy5
// J83w8Su/VmA04W9WoyMkuzKyAzVBxdLTq3BeaUMNrywqjlFg/B6zo0b0+Qf6mGzb
// codZjwIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBSfr5XCimuq
// RVi4OWvqJVcWaLjbezAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEB
// ABkf3+lbHvzdjGtAKCM/ic6MBgKHdetQRQHNtAqXuphLSBMirDoMMHX+yJ+EJ9rM
// Rqomh3oaBEq7+fIXlzRHd4svTZr1gn/UD5L3+IGgZASrJyDvzHXbReDAvKS0P23n
// jtDWFk0WKTW5FIsqW9foG2rhgSEtwYIk1i5mh/p+H5A698QpKIPn6Lj4HL3HWfME
// mTHH994DvSxepyLqLFipE8tMldXjWoYEuww+AjwAD1UoTjp2JvZ05Bn04QZMwB2k
// IQTbvSYRfnSZqaMshdjGGZ0tcJUNZUhTs6fA8sZHr/orZqAMzazREJ+HhPFUBIAF
// +AfRsl9QTMFVqBL0G191EYw=
// -----END CERTIFICATE-----`;

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
   const jwt: Jwt = decode(token, { complete: true }) as Jwt
   let cert: string | Buffer
   // TODO: Implement token verification
   const response = await Axios(jwksUrl);
   const responseData = response.data;
   const key = responseData['keys'].find(key => key['kid'] === jwt['header']['kid']);
   if (!key) {
     throw new Error('Invalid Signing key');
   }
   const { x5c } = key;
   cert = `-----BEGIN CERTIFICATE-----\n${x5c[0]}\n-----END CERTIFICATE-----`;
   return verify(token, cert, {algorithms: ['RS256']}) as JwtPayload;
 }
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/ 

// async function getSecret() {
//   if(cachedsecret) {
//     return cachedsecret}

// const data = await client.getSecretValue({
//   SecretId: secretId
// }).promise();
// cachedsecret= data.SecretString;
// return JSON.parse(cachedsecret);
// }
function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
