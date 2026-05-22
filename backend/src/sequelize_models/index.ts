// import dotenv from "dotenv";
// dotenv.config({
//   debug:true,
// });

import { Sequelize } from "sequelize";
import { Doctor } from "./Doctor.js";
import { Patient } from "./Patient.js";
import { InferenceHistory } from "./InferenceHistory.js";
import { RefreshToken } from "./RefreshToken.js";
import { AuditLog } from "./AuditLog.js";

const sequelize = new Sequelize(
  process.env.DB_NAME!,
  process.env.DB_USER!,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT as any,
    port: Number(process.env.DB_PORT),
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
);

const db = {
  sequelize,
  Doctor,
  Patient,
  InferenceHistory,
  RefreshToken,
  AuditLog,
};

// Initialize db
Object.values(db).forEach((model) => {
  if ("initModel" in model) {
    (model as any).initModel(sequelize);
  }
});

// Set associations
Object.values(db).forEach((model) => {
  if ("associate" in model) {
    (model as any).associate(db);
  }
});

export default db;
