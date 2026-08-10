import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { s3Client } from "../../helpers/aws.js";
import { sqsClient } from "../../helpers/aws.js";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import AWSXRay, { tracingEnabled } from "../../helpers/tracing.js";
import type { UploadedDataObject } from "./types.js";
import db from "../../sequelize_models/index.js";
import ApiError from "../../helpers/ApiError.js";
import status from "http-status";
import { Socket } from "socket.io";

const getSqsTraceHeader = (): string | undefined => {
  if (!tracingEnabled) {
    return undefined;
  }

  const segment = AWSXRay.getSegment() as
    | { trace_id?: string; id?: string; notTraced?: boolean }
    | undefined;

  if (!segment?.trace_id || !segment?.id) {
    return undefined;
  }

  const sampled = segment.notTraced ? "0" : "1";
  return `Root=${segment.trace_id};Parent=${segment.id};Sampled=${sampled}`;
};

export const pushToSqsQueue = async (
  messageBody: UploadedDataObject,
): Promise<any> => {
  const queueUrl = process.env.SQS_QUEUE_URL;

  if (!queueUrl) {
    throw new ApiError(
      status.INTERNAL_SERVER_ERROR,
      "SQS queue configuration is missing",
    );
  }

  const traceHeader = getSqsTraceHeader();

  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(messageBody),
    ...(traceHeader
      ? {
          MessageSystemAttributes: {
            AWSTraceHeader: {
              DataType: "String",
              StringValue: traceHeader,
            },
          },
        }
      : {}),
  });

  try {
    const response = await sqsClient.send(command);

    return response;
  } catch (error) {
    throw new ApiError(
      status.INTERNAL_SERVER_ERROR,
      "Failed to queue inference request",
      undefined,
      error,
    );
  }
};

// Helper upload function
const uploadSingleFile = async (file: Express.Multer.File, key: string) => {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );
};

export const uploadImagesToS3 = async (
  files: { [fieldname: string]: Express.Multer.File[] },
  patientId: number,
  iterationId: string,
  doctorId: number,
  imageId?: string,
): Promise<UploadedDataObject> => {
  try {
    const input_image_details: {
      side: string;
      bucket_key: string;
      csv_key?: string;
      image_id?: string;
    }[] = [];

    // LEFT IMAGE
    const leftImage = files.leftImage?.[0];

    if (leftImage) {
      const key = `${doctorId}/${patientId}/${iterationId}/input/left`;

      await uploadSingleFile(leftImage, key);

      input_image_details.push({
        side: "left",
        bucket_key: key,
        image_id: imageId,
      });
    }

    // RIGHT IMAGE
    const rightImage = files.rightImage?.[0];

    if (rightImage) {
      const key = `${doctorId}/${patientId}/${iterationId}/input/right`;

      await uploadSingleFile(rightImage, key);

      input_image_details.push({
        side: "right",
        bucket_key: key,
        image_id: imageId,
      });
    }

    // FRONT IMAGE
    const frontImage = files.frontImage?.[0];

    const frontCsv = files.frontCsv?.[0];

    if (frontImage) {
      const imageKey = `${doctorId}/${patientId}/${iterationId}/input/front`;

      await uploadSingleFile(frontImage, imageKey);

      let csvKey: string | undefined;

      if (frontCsv) {
        csvKey = `${doctorId}/${patientId}/${iterationId}/input/front-csv`;

        await uploadSingleFile(frontCsv, csvKey);
      }

      input_image_details.push({
        side: "front",
        bucket_key: imageKey,
        csv_key: csvKey,
        image_id: imageId,
      });
    }

    return {
      doctor_id: doctorId,
      patient_id: patientId,
      iterationId,
      image_id: imageId,
      input_image_details,
    };
  } catch (error) {
    console.error("Error uploading images to S3:", error);
    throw new ApiError(
      status.INTERNAL_SERVER_ERROR,
      "Failed to upload images",
      undefined,
      error,
    );
  }
};

export const saveInputImageKeysToDB = async (
  uploadedData: UploadedDataObject,
): Promise<number> => {
  try {
    return await db.sequelize.transaction(async (t) => {
      const doctorIdNum = uploadedData.doctor_id;
      const patientIdNum = uploadedData.patient_id;

      const existingPatient = await db.Patient.findOne({
        where: {
          id: patientIdNum,
        },
        transaction: t,
      });

      if (!existingPatient) {
        throw new ApiError(status.NOT_FOUND, "Patient not found");
      }

      const input_keys: {
        left?: string;
        right?: string;
        front?: string;
        front_csv?: string;
      } = {};

      uploadedData.input_image_details.forEach((detail) => {
        if (detail.side === "left") input_keys.left = detail.bucket_key;
        if (detail.side === "right") input_keys.right = detail.bucket_key;
        if (detail.side === "front") {
          input_keys.front = detail.bucket_key;
          input_keys.front_csv = detail.csv_key;
        }
      });

      const inferenceHistory = await db.InferenceHistory.create(
        {
          patient_id: patientIdNum,
          doctor_id: doctorIdNum,
          iteration_code: uploadedData.iterationId,
          input_bucket_keys: input_keys,
          status: "PROCESSING",
        },
        { transaction: t },
      );

      return inferenceHistory.getDataValue("id") as number;
    });
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      status.INTERNAL_SERVER_ERROR,
      "Error saving inference input",
      undefined,
      err,
    );
  }
};

export const saveOutputImageKeysToDB = async (
  doctorId: number | string,
  patientId: number | string,
  iterationId: string,
  outputKeys: { left: string; right: string; front: string },
): Promise<void> => {
  try {
    await db.sequelize.transaction(async (t) => {
      const doctorIdNum =
        typeof doctorId === "string"
          ? parseInt(doctorId.replace(/\D/g, ""), 10)
          : doctorId;
      const patientIdNum =
        typeof patientId === "string" ? parseInt(patientId, 10) : patientId;

      const existingRecord = await db.InferenceHistory.findOne({
        where: {
          doctor_id: doctorIdNum,
          patient_id: patientIdNum,
          iteration_code: iterationId,
        },
        transaction: t,
      });

      if (!existingRecord) {
        throw new ApiError(status.NOT_FOUND, "Inference record not found");
      }

      await existingRecord.update(
        {
          output_bucket_keys: outputKeys,
          status: "COMPLETED",
        },
        { transaction: t },
      );
    });
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      status.INTERNAL_SERVER_ERROR,
      "Error saving inference output",
      undefined,
      err,
    );
  }
};

export const generateSignedUrls = async (outputKeys: {
  left: string;
  right: string;
  front: string;
}): Promise<Record<string, string>> => {
  try {
    const urls: Record<string, string> = {};

    for (const [side, key] of Object.entries(outputKeys)) {
      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
      });
      urls[side] = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    }

    return urls;
  } catch (error) {
    throw new ApiError(
      status.INTERNAL_SERVER_ERROR,
      "Failed to generate download URLs",
      undefined,
      error,
    );
  }
};

export const processInferenceResult = async (
  doctor_id: number,
  patient_id: number,
  iterationId: string,
  output_images_keys: { left: string; right: string; front: string },
): Promise<Record<string, string> | null> => {
  try {
    // Check for duplicates
    const existingRecord = await db.InferenceHistory.findOne({
      where: {
        patient_id,
        iteration_code: iterationId,
      },
    });

    // If already COMPLETED, SNS duplicate delivery happened
    if (existingRecord && existingRecord.status === "COMPLETED") {
      return null;
    }

    // Save outputs and update status
    await saveOutputImageKeysToDB(
      doctor_id,
      patient_id,
      iterationId,
      output_images_keys,
    );

    // Generate signed URLs
    const signedUrls = await generateSignedUrls(output_images_keys);

    return signedUrls;
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === status.NOT_FOUND) {
      return null;
    }
    throw new ApiError(
      status.INTERNAL_SERVER_ERROR,
      "Failed to process inference result",
      undefined,
      error,
    );
  }
};

export const emitToDoctor = (
  io: Socket,
  doctor_id: string,
  payload: any,
): void => {
  console.log(`Emitting to doctor ${doctor_id}:`, payload);
  io.to(doctor_id).emit("prediction_complete", payload);
};

export const confirmSnsSubscription = async (
  subscribeURL: string,
): Promise<void> => {
  if (!subscribeURL) {
    throw new ApiError(status.BAD_REQUEST, "Missing SubscribeURL");
  }

  const response = await fetch(subscribeURL);

  if (!response.ok) {
    throw new ApiError(
      status.INTERNAL_SERVER_ERROR,
      "SNS subscription confirmation failed",
    );
  }
};

export const resultTimeOutService = (
  inferenceId: number,
  timeInMin: number,
): void => {
  setTimeout(
    async () => {
      try {
        await db.sequelize.transaction(async (timeoutTx) => {
          const record = await db.InferenceHistory.findOne({
            where: { id: inferenceId },
            transaction: timeoutTx,
          });
          if (record && record.getDataValue("status") === "PROCESSING") {
            await record.update(
              { status: "FAILED" },
              { transaction: timeoutTx },
            );
          }
        });
      } catch (err) {
        console.error(
          "Timeout update failed for inferenceHistory ID:",
          inferenceId,
          err,
        );
      }
    },
    timeInMin * 60 * 1000,
  );
};
