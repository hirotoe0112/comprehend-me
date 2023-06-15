import { S3, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { TranslateClient, TranslateTextCommand } from '@aws-sdk/client-translate'

const AWS_REGION = 'ap-northeast-1'

const s3 = new S3({
    region: AWS_REGION,
})
const translate = new TranslateClient({
    region: AWS_REGION,
})

export const handler = async(event: any) => {
    const bucket = event.Records[0].s3.bucket.name
    const key = decodeURI(event.Records[0].s3.object.key)

    /**
     * S3の内容を取得
    */
    const getObjectCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    });
    const response = await s3.send(getObjectCommand);
    const body = await response.Body?.transformToString();

    /**
     * 取得した内容を英語に翻訳
    */
    const translateTextCommand = new TranslateTextCommand({
        SourceLanguageCode: "ja",
        TargetLanguageCode: "en",
        Text: body
    });
    const result = await translate.send(translateTextCommand)
    const translatedText = result.TranslatedText

    /**
     * 翻訳結果をS3に書き戻す
    */
    const putObjectCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: key.replace('ja/', 'en/'),
        Body: translatedText,
    });
    await s3.send(putObjectCommand);
}