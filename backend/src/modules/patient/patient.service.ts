import db from "../../sequelize_models/index.js";
import type {
  GetPatientsRequestType,
  GetPatientsResponseType,
  PatientsRowType,
  PatientDropdownItemType,
  GetPatientDropdownResponseType,
  CreatePatientRequestType,
  UpdatePatientRequestType,
} from "../../../../shared/types/Patients/Patients.types.js";
import ApiError from "../../helpers/ApiError.js";
import httpStatus from "http-status";
import { Op } from "sequelize";

const findPatientByEmail = async (
  doctorId: number,
  email: string,
  excludePatientId?: number,
  transaction?: any,
) => {
  return db.Patient.findOne({
    where: {
      doctor_id: doctorId,
      email: {
        [Op.iLike]: email,
      },
      ...(excludePatientId ? { id: { [Op.ne]: excludePatientId } } : {}),
    },
    transaction,
  });
};

export const getPatients = async (
  query: GetPatientsRequestType,
  doctorId: number,
): Promise<GetPatientsResponseType> => {
  try {
    const { page, limit, search, sortOrder, sortField } = query;
    const offset = (page - 1) * limit;

    const whereClause: any = { doctor_id: doctorId };
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const order: any[] = [[sortField, sortOrder]];

    const { rows, count } = await db.Patient.findAndCountAll({
      where: whereClause,
      order,
      limit,
      offset,
    });

    const formattedRows = rows.map((row: any) => {
      const formattedRow: PatientsRowType = {
        id: row.id,
        name: row.name,
        age: String(row.age),
        email: row.email,
        gender: row.gender as "MALE" | "FEMALE",
        createdAt: new Date(row.createdAt).toLocaleString(),
      };
      return formattedRow;
    });

    const response: GetPatientsResponseType = {
      rows: formattedRows,
      meta: { total: count },
    };

    return response;
  } catch (error: any) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Error fetching patients",
      undefined,
      error,
    );
  }
};

export const getPatientDropdown = async (
  doctorId: number,
): Promise<GetPatientDropdownResponseType> => {
  try {
    const rows = await db.Patient.findAll({
      attributes: ["id", "name"],
      where: { doctor_id: doctorId },
      order: [["name", "ASC"]],
      raw: true,
    });

    const formattedRows: PatientDropdownItemType[] = rows.map((row: any) => ({
      id: row.id,
      name: row.name,
    }));

    return { rows: formattedRows };
  } catch (error: any) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Error fetching patient dropdown data",
      undefined,
      error,
    );
  }
};

export const createPatient = async (
  data: CreatePatientRequestType,
  doctorId: number,
): Promise<PatientsRowType> => {
  try {
    const newPatient = await db.sequelize.transaction(async (t) => {
      const email = data.email.trim();
      const existingPatient = await findPatientByEmail(
        doctorId,
        email,
        undefined,
        t,
      );

      if (existingPatient) {
        throw new ApiError(
          httpStatus.CONFLICT,
          "Patient with this email already exists",
        );
      }

      const patient = await db.Patient.create(
        {
          doctor_id: doctorId,
          name: data.name,
          age: data.age,
          email,
          gender: data.gender,
        },
        { transaction: t },
      );

      return patient;
    });

    return {
      id: newPatient.id,
      name: newPatient.name,
      age: String(newPatient.age),
      email: newPatient.email,
      gender: newPatient.gender as "MALE" | "FEMALE",
      createdAt: new Date(newPatient.createdAt).toLocaleString(),
    };
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Error creating patient",
      undefined,
      error,
    );
  }
};

export const updatePatient = async (
  data: UpdatePatientRequestType,
  doctorId: number,
): Promise<PatientsRowType> => {
  try {
    const updatedPatient = await db.sequelize.transaction(async (t) => {
      const email = data.email.trim();
      const existing = await db.Patient.findOne({
        where: {
          id: data.id,
          doctor_id: doctorId,
        },
        transaction: t,
      });

      if (!existing) {
        throw new ApiError(
          httpStatus.NOT_FOUND,
          "Patient not found or you do not have permission to update it",
        );
      }

      await existing.update(
        {
          name: data.name,
          age: data.age,
          email,
          gender: data.gender,
        },
        { transaction: t },
      );

      return existing;
    });

    return {
      id: updatedPatient.id,
      name: updatedPatient.name,
      age: String(updatedPatient.age),
      email: updatedPatient.email,
      gender: updatedPatient.gender as "MALE" | "FEMALE",
      createdAt: new Date(updatedPatient.createdAt).toLocaleString(),
    };
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Error updating patient",
      undefined,
      error,
    );
  }
};

export const deletePatient = async (
  patientId: number,
  doctorId: number,
): Promise<void> => {
  try {
    await db.sequelize.transaction(async (t) => {
      const existing = await db.Patient.findOne({
        where: {
          id: patientId,
          doctor_id: doctorId,
        },
        transaction: t,
      });

      if (!existing) {
        throw new ApiError(httpStatus.NOT_FOUND, "Patient not found");
      }

      await existing.destroy({ transaction: t });
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Error deleting patient",
      undefined,
      error,
    );
  }
};
