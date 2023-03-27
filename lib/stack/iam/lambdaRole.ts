import { Role } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { aws_iam as iam } from "aws-cdk-lib";

export default class SQSLambdaRole extends Role {
  constructor(scope: Construct) {
    super(scope, `SQSLambdaRole`, {
      roleName: 'SQSLambdaRole',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ['arn:aws:logs:*:*:*'],
        actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      })
    );
  }
}
