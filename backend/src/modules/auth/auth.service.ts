import db from "../../sequelize_models/index.js";
import ApiError from "../../helpers/ApiError.js";
import httpStatus from "http-status";

import { GoogleProfile } from "./auth.types.js";

export const findOrCreateGoogleUser = async (
  profile: GoogleProfile,
): Promise<any> => {
  try {
    const googleId = profile.id;

    const email = profile.emails?.[0]?.value;

    if (!email) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Google email not found");
    }

    let user = await db.Doctor.findOne({
      where: {
        google_id: googleId,
      },
    });

    if (!user) {
      user = await db.Doctor.create({
        google_id: googleId,
        email,
      });
    }

    return user;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Error during Google authentication",
      undefined,
      error,
    );
  }
};
