import { S3, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { ComprehendClient, BatchDetectTargetedSentimentCommand, TargetedSentimentMention } from "@aws-sdk/client-comprehend"

const AWS_REGION = "ap-northeast-1"

const s3 = new S3({
  region: AWS_REGION,
})

const comprehend = new ComprehendClient({
  region: AWS_REGION,
})

export const handler = async(event: any) => {
  const bucket = event.Records[0].s3.bucket.name
  const key = event.Records[0].s3.object.key
  
  /**
   * S3の内容を取得
   */
  const getObjectCommand = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  })
  const response = await s3.send(getObjectCommand)
  const body = await response.Body?.transformToString()

  if(!body) return

  /**
   * 取得した内容を分析
   */
  const command = new BatchDetectTargetedSentimentCommand({
    TextList: [
      body,
    ],
    LanguageCode: "en",
  })
  const result = await comprehend.send(command)

  if(!result.ResultList) return
  if(!result.ResultList![0].Entities) return

  /**
   * 欲しい部分のみ抽出
   */
  const formattedResult: {
    Mentions: TargetedSentimentMention[]
  } = {
    Mentions: []
  }
  for(const entity of result.ResultList[0].Entities){
    if(!entity.Mentions) continue
    for(const mention of entity.Mentions){
      formattedResult.Mentions.push(mention)
    }
  }
  
  /**
   * データをS3に保存
   */
  const putObjectCommand = new PutObjectCommand({
    Bucket: bucket,
    Key: key.replace('en/', 'output/').replace('.md', '.json'),
    Body: JSON.stringify(formattedResult),
  });
  await s3.send(putObjectCommand);
};
