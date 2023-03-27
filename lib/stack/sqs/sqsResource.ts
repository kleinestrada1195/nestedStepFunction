import { aws_sqs as sqs, Duration, Stack, CfnOutput, aws_iam as iam } from 'aws-cdk-lib'
import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'

export type QueueProps = {
  name: string
  lambdaRole: iam.IGrantable
}

export default class CreateQueue extends sqs.Queue {
  constructor(scope: Construct, props: QueueProps) {
    super(scope, `${props.name}Queue`, {
      queueName: `${Stack.of(scope).stackName}-${props.name}Queue`,
      visibilityTimeout: Duration.seconds(3),
      deadLetterQueue: {
        queue: new sqs.Queue(Stack.of(scope), `${props.name}Dlq`, {
          queueName: `${Stack.of(scope).stackName}-${props.name}Dlq`,
          retentionPeriod: cdk.Duration.days(14),
        }),
        maxReceiveCount: 1,
      },
    })
    
    this.grantConsumeMessages(props.lambdaRole);

    const stack = Stack.of(this)
    
    // Export queue URL
    new CfnOutput(this, `${props.name}QueueUrl`, {
      exportName: `${stack.stackName}-${props.name}QueueUrl`,
      value: this.queueUrl,
    })

    // Export queue ARN
    new CfnOutput(this, '${props.name}QueueArn', {
      exportName: `${stack.stackName}-${props.name}QueueArn`,
      value: this.queueArn,
    })
  }
}
