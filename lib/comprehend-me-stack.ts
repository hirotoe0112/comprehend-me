import * as cdk from 'aws-cdk-lib'
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications'
import { Bucket, EventType } from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'

export class ComprehendMeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const s3bucket = new Bucket(this, 'ArticlesForComprehendMe', {
      bucketName: 'articles-for-comprehend-me'
    })
    const translateFunction = new NodejsFunction(this, 'translate-function', {
      functionName: 'translate-function',
      entry: 'lambda/translate-function.ts'
    })
    translateFunction.addToRolePolicy(new PolicyStatement({
      resources: [`${s3bucket.bucketArn}/*`],
      actions: ['s3:GetObject', 's3:PutObject'],
    }))
    translateFunction.addToRolePolicy(new PolicyStatement({
      resources: ['*'],
      actions: ['translate:TranslateText'],
    }))

    s3bucket.addEventNotification(
      EventType.OBJECT_CREATED_PUT,
      new LambdaDestination(translateFunction), {
        prefix: 'ja/'
      }
    )

    const comprehendFunction = new NodejsFunction(this, 'comprehend-function', {
      functionName: 'comprehend-function',
      entry: 'lambda/comprehend-function.ts'
    })
    comprehendFunction.addToRolePolicy(new PolicyStatement({
      resources: [`${s3bucket.bucketArn}/*`],
      actions: ['s3:GetObject', 's3:PutObject'],
    }))
    comprehendFunction.addToRolePolicy(new PolicyStatement({
      resources: ['*'],
      actions: ['comprehend:BatchDetectTargetedSentiment'],
    }))

    s3bucket.addEventNotification(
      EventType.OBJECT_CREATED_PUT,
      new LambdaDestination(comprehendFunction), {
        prefix: 'en/'
      }
    )
  }
}
