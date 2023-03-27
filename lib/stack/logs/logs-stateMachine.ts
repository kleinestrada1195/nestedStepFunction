import { aws_logs as logs } from 'aws-cdk-lib'
import { Construct } from 'constructs'

export type StateMachineLogProps = {
  name: string
}

export default class StateMachineLogGroup extends logs.LogGroup {
  constructor(scope: Construct, props: StateMachineLogProps) {
    super(scope, `${props.name}LogGroup`, {
      logGroupName: `/aws/vendedlogs/states/${props.name}-Logs`,
    })
  }
}