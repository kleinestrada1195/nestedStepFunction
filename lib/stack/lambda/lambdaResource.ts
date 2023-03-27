import { Function } from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { IRole } from 'aws-cdk-lib/aws-iam'
import { aws_lambda as lambda } from 'aws-cdk-lib'

export type LambdaProps = {
  name: string
  customRole: IRole
  queueURL: string
}

export default class CreateLambdaFunction extends Function {
  constructor(scope: Construct, props: LambdaProps) {
    super(scope, `${props.name}Function`, {
     functionName: `${props.name}`,
     runtime: lambda.Runtime.NODEJS_16_X,
     architecture: lambda.Architecture.ARM_64,
     code: lambda.Code.fromAsset('src'),
     handler: `lambdaHandler.default`,
     environment: {
      QUEUE_URL: props.queueURL,
     }
  })
}
}


// ...commonLambdaConfig,
//       name: ${props.name},
//       handler: `lambdaHandler.default`,
//       role: props.customRole,
//       environmentVariables:{
//         QUEUE_URL: props.queueURL,
//       },
//     })