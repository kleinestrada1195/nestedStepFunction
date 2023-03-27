import { ArbitraryObject } from "@amaysim/cdk-constructs/types/Globals";

const lambdaHandler = async(event: ArbitraryObject):Promise<void> => {
    // For every record in sqs queue
    for (const record of event.Records) {
        const messageBody = JSON.parse(record.body);
        const taskToken = messageBody.TaskToken;
        console.log(messageBody, 'records')
        
        const params = {
            output: "\"passed\"",
            taskToken: ''
        };

        console.log(`Calling Step Functions to complete callback task with params ${JSON.stringify(params)}`);

        // // Approve
        // stepfunctions.sendTaskSuccess(params, (err, data) => {
        //     if (err) {
        //         console.error(err.message);
        //         callback(err.message);
        //         return;
        //     }
        //     console.log(data);
        //     callback(null);
        // });
    }
};

export default lambdaHandler