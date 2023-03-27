import * as cdk from 'aws-cdk-lib';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';
import StateMachineResource from './stack/state-machine/stateMachineResource'
import StateMachineLogGroup from './stack/logs/logs-stateMachine';
import SQSLambdaRole from './stack/iam/lambdaRole';
import CreateQueue from './stack/sqs/sqsResource';
import CreateLambdaFunction from './stack/lambda/lambdaResource';

export class NestedStepStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //=====================LOG GROUP=======================
    const mainOrchLogGrp = new StateMachineLogGroup(this, {
      name: 'mainOrch'
    })

    const firstChileLogGrp = new StateMachineLogGroup(this, {
      name: 'firstChildOrch'
    })

    const secondChileLogGrp = new StateMachineLogGroup(this, {
      name: 'secondChildOrch'
    })

    const thirdChileLogGrp = new StateMachineLogGroup(this, {
      name: 'thirdChildOrch'
    })

    //=====================SQS LAMBDA POLICY======================
    const policy = new SQSLambdaRole(this)

    //=====================2ND NESTED ORCHESTRATOR=======================
    // create SQS
    const thirdChildSQS = new CreateQueue(this, {
      name: 'thirdChild',
      lambdaRole: policy
    })
    // create lambda
    const thirdChildLambda = new CreateLambdaFunction(this, {
      name: 'thirdChild',
      customRole: policy,
      queueURL: thirdChildSQS.queueUrl
    })
    // integrate sqs and lambda
    const thirdEventSource = new cdk.aws_lambda_event_sources.SqsEventSource(thirdChildSQS)
    thirdChildLambda.addEventSource(thirdEventSource)

    // Send message to SQS
    const thirdChildDefinition = new cdk.aws_stepfunctions_tasks.SqsSendMessage(this, 'SendMessage3', {
      queue: thirdChildSQS,
      integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
      messageBody: sfn.TaskInput.fromObject({
        input: sfn.TaskInput.fromJsonPathAt('$$.Execution.Input'),
        task_token: sfn.JsonPath.taskToken,
      }),
      resultSelector: {
        result: sfn.JsonPath.objectAt('$.Payload.result'),
      },
      resultPath: '$.thirdChild',
    })

    //Creation of the state machine
    const thirdChild = new StateMachineResource(this, {
      name: 'StateWaitUsingTaskToken',
      taskChain: thirdChildDefinition,
      logGroup: thirdChileLogGrp,
    })

    // State machine as a task
    const thirdChildTask = new cdk.aws_stepfunctions_tasks.StepFunctionsStartExecution(this, 'StateWaitUsingTaskToken', {
      stateMachine: thirdChild,
      input: sfn.TaskInput.fromObject({
        input: sfn.JsonPath.stringAt('$$.Execution.Input'),
        task_token: sfn.JsonPath.taskToken,
      }),
      integrationPattern: cdk.aws_stepfunctions.IntegrationPattern.WAIT_FOR_TASK_TOKEN
    })

    //=====================2ND NESTED ORCHESTRATOR=======================
    // create SQS
    const secondChildSQS = new CreateQueue(this, {
      name: 'secondChild',
      lambdaRole: policy
    })
    // create lambda
    const secondChildLambda = new CreateLambdaFunction(this, {
      name: 'secondChild',
      customRole: policy,
      queueURL: secondChildSQS.queueUrl
    })
    // integrate sqs and lambda
    const secondEventSource = new cdk.aws_lambda_event_sources.SqsEventSource(secondChildSQS)
    secondChildLambda.addEventSource(secondEventSource)

    // Send message to SQS
    const secondChildDefinition = new cdk.aws_stepfunctions_tasks.SqsSendMessage(this, 'SendMessage2', {
      queue: secondChildSQS,
      integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
      messageBody: sfn.TaskInput.fromObject({
        input: sfn.TaskInput.fromJsonPathAt('$$.Execution.Input'),
        task_token: sfn.JsonPath.taskToken,
      }),
      resultSelector: {
        result: sfn.JsonPath.objectAt('$.Payload.result'),
      },
      resultPath: '$.secondChild',
    })

    //Creation of the state machine
    const secondChild = new StateMachineResource(this, {
      name: 'StateWaitUsingRunJob',
      taskChain: secondChildDefinition,
      logGroup: secondChileLogGrp,
    })

    // State machine as a task
    const secondChildTask = new cdk.aws_stepfunctions_tasks.StepFunctionsStartExecution(this, 'StateWaitUsingRunJob', {
      stateMachine: secondChild,
      input: sfn.TaskInput.fromJsonPathAt('$'),
      integrationPattern: cdk.aws_stepfunctions.IntegrationPattern.RUN_JOB
    })

    //=====================1ST NESTED ORCHESTRATOR=======================
    // create SQS
    const firstChildSQS = new CreateQueue(this, {
      name: 'firstChild',
      lambdaRole: policy
    })
    // create lambda
    const firstChildLambda = new CreateLambdaFunction(this, {
      name: 'firstChild',
      customRole: policy,
      queueURL: firstChildSQS.queueUrl
    })
    // integrate sqs and lambda
    const firstEventSource = new cdk.aws_lambda_event_sources.SqsEventSource(firstChildSQS)
    firstChildLambda.addEventSource(firstEventSource)

    // Send message to SQS
    const firstChildDefinition = new cdk.aws_stepfunctions_tasks.SqsSendMessage(this, 'SendMessage1', {
      queue: firstChildSQS,
      integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
      messageBody: sfn.TaskInput.fromObject({
        input: sfn.TaskInput.fromJsonPathAt('$$.Execution.Input'),
        task_token: sfn.JsonPath.taskToken,
      }),
      resultSelector: {
        result: sfn.JsonPath.objectAt('$.Payload.result'),
      },
      resultPath: '$.firstChild',
    })

    //========================FIRST SUBWORKFLOW===================
    //Creation of the first subflow state machine
    const firstChild = new StateMachineResource(this, {
      name: 'StateContinue',
      taskChain: firstChildDefinition,
      logGroup: firstChileLogGrp,
    })

    // Code that will initialize a "start and continue"
    const firstChildTask = new cdk.aws_stepfunctions_tasks.StepFunctionsStartExecution(this, 'StateContinue', {
      stateMachine: firstChild,
      input: sfn.TaskInput.fromJsonPathAt('$'),
    })

    //=====================MAIN WORKFLOW=========================
    const chain = firstChildTask.next(secondChildTask).next(thirdChildTask)
    
    // Creation of the main orchestrator state machine
    const mainOrch = new StateMachineResource(this, {
      name: 'mainOrchestrator',
      taskChain: chain, 
      logGroup: mainOrchLogGrp,
    })

  }
}
