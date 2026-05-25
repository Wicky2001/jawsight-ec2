import "dotenv/config";
import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient } from "@aws-sdk/client-sqs";
import AWSXRay, { tracingEnabled } from "./tracing.js";

const baseS3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
});

export const s3Client = tracingEnabled
  ? AWSXRay.captureAWSv3Client(baseS3Client)
  : baseS3Client;

const baseSqsClient = new SQSClient({
  region: process.env.AWS_REGION || "ap-south-1",
});

export const sqsClient = tracingEnabled
  ? AWSXRay.captureAWSv3Client(baseSqsClient)
  : baseSqsClient;
