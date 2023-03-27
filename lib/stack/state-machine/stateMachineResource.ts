import { aws_logs as logs, aws_stepfunctions as sfn,aws_iam as iam } from 'aws-cdk-lib'
import { Construct } from 'constructs'

export type StateMachineProps = {
  name: string
  taskChain: sfn.IChainable
  logGroup: logs.LogGroup
}

export default class StateMachineResource extends sfn.StateMachine {
  constructor(scope: Construct, props: StateMachineProps) {
    super(scope, `${props.name}StateMachineResource`, {
      stateMachineName: `${props.name}-StateMachineResource`,
      definition: props.taskChain,
      tracingEnabled: true,
      logs: {
        destination: props.logGroup,
        includeExecutionData: true,
        level: sfn.LogLevel.ALL,
      },
    })
  }
}
