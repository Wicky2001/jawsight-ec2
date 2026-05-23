import { Request, Response } from "express";
import httpStatus from "http-status";
import {
  pushToSqsQueue,
  uploadImagesToS3,
  saveInputImageKeysToDB,
  processInferenceResult,
  emitToDoctor,
  resultTimeOutService,
} from "./inference.service.js";
import ApiError from "../../helpers/ApiError.js";
import { catchAsync } from "../../helpers/error.handlers.js";
import { v4 as uuidv4 } from "uuid";
import { UploadedDataObject } from "./types.js";
import { validateSnsPayload } from "./validations.js";
import { confirmSnsSubscription } from "./inference.service.js";

export const snsWebhookController = async (req: Request, res: Response) => {
  const io = req.app.get("socketio");

  try {
    const snsMessageType = req.headers["x-amz-sns-message-type"];

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    // =========================
    // Subscription Confirmation
    // =========================
    if (snsMessageType === "SubscriptionConfirmation") {
      await confirmSnsSubscription(body.SubscribeURL);

      return res.status(httpStatus.OK).json({
        status: "subscription_confirmed",
        topic_arn: body.TopicArn,
      });
    }

    // =========================
    // Unknown Message Type
    // =========================
    if (snsMessageType !== "Notification") {
      return res.status(httpStatus.BAD_REQUEST).send("Unknown message type");
    }

    // =========================
    // Acknowledge SNS Immediately
    // =========================
    res.status(httpStatus.OK).send("Message Received");

    // =========================
    // Parse Notification
    // =========================
    const payload = JSON.parse(body.Message);

    const { status, data, message } = payload;

    const { doctor_id, patient_id, iterationId, output_images_keys } =
      data || {};

    // =========================
    // Validation
    // =========================
    validateSnsPayload({
      doctor_id,
      patient_id,
      iterationId,
      output_images_keys,
    });

    // =========================
    // Process Result
    // =========================
    const signedUrls = await processInferenceResult(
      doctor_id,
      patient_id,
      iterationId,
      output_images_keys,
    );

    // Duplicate SNS delivery
    if (!signedUrls) {
      return;
    }

    console.log("Generated signed URLs:", signedUrls);

    // =========================
    // Emit Success
    // =========================
    emitToDoctor(io, doctor_id, {
      status: status || "success",
      message: message || "Inference completed successfully",
      data: signedUrls,
    });
  } catch (error) {
    try {
      console.log("Error in SNS webhook controller:", error);
      const body =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body;

      const payload = body?.Message ? JSON.parse(body.Message) : null;

      const doctor_id = payload?.data?.doctor_id;

      if (doctor_id) {
        emitToDoctor(io, doctor_id, {
          status: "error",
          message: "An unknown error occurred during inference",
        });
      }
    } catch (innerError) {
      // Silently fail if unable to notify doctor
    }
  }
};

export const uploadImagesController = catchAsync(
  async (req: Request, res: Response) => {
    const patientId = req.body?.patientId;
    if (!patientId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "patientId is required in the request body",
      );
    }

    const iterationId = `iter_${uuidv4()}`;

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const leftImage = files.leftImage?.[0];
    const rightImage = files.rightImage?.[0];
    const frontImage = files.frontImage?.[0];
    const frontCsv = files.frontCsv?.[0];

    if (!leftImage || !rightImage || !frontImage || !frontCsv) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "All images and CSV file are required",
      );
    }

    //Upload images to S3 and get their URLs

    const uploadedData: UploadedDataObject = await uploadImagesToS3(
      files,
      patientId,
      iterationId,
      req.user?.id!,
    );

    // save bucket keys to DB
    const inferenceHistoryId = await saveInputImageKeysToDB(uploadedData);

    // Push the message to SQS
    await pushToSqsQueue(uploadedData);

    resultTimeOutService(inferenceHistoryId, 15);

    res.status(httpStatus.ACCEPTED).json({
      status: "success",
      message: "Images successfully uploaded and queued for ML processing.",
      data: {
        iterationId: iterationId,
        status: "PROCESSING",
      },
    });
  },
);
