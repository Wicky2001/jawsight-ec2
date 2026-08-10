import "dotenv/config";
import { createRequire } from "module";
import { Sequelize } from "sequelize";
import AWSXRay, { tracingEnabled } from "../helpers/tracing.js";
import { Doctor } from "./Doctor.js";
import { Patient } from "./Patient.js";
import { InferenceHistory } from "./InferenceHistory.js";
import { RefreshToken } from "./RefreshToken.js";
import { AuditLog } from "./AuditLog.js";

const require = createRequire(import.meta.url);
const pg = require("pg");
const dialectModule = tracingEnabled ? AWSXRay.capturePostgres(pg) : undefined;
const dialect = (process.env.DB_DIALECT ?? "postgres") as any;

const createSequelize = () =>
  new Sequelize(
    process.env.DB_NAME!,
    process.env.DB_USER!,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect,
      ...(dialectModule ? { dialectModule } : {}),
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

let sequelize = createSequelize();

if (process.env.NODE_ENV === "development") {
  sequelize = new Sequelize(
    process.env.DB_NAME!,
    process.env.DB_USER!,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect,
      port: Number(process.env.DB_PORT),
      logging: false,
    },
  );
}

const db = {
  sequelize,
  Doctor,
  Patient,
  InferenceHistory,
  RefreshToken,
  AuditLog,
};

Object.values(db).forEach((model) => {
  if ("initModel" in model) {
    (model as any).initModel(sequelize);
  }
});

Object.values(db).forEach((model) => {
  if ("associate" in model) {
    (model as any).associate(db);
  }
});

export default db;
