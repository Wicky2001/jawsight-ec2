import express from "express";
import mainRouter from "./routes/index.js";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";
import passport from "./helpers/auth/passport.js";
import { errorConverter, errorHandler } from "./helpers/error.handlers.js";
import morgan from "morgan";
import db from "./sequelize_models/index.js";
import { tracingEnabled } from "./helpers/tracing.js";
import xrayExpress from "aws-xray-sdk-express";

const app = express();
const acmeChallengeToken = "lr7rW1s_1wm7pxa65J6ji6bHgjTqBhNBp3mNbN_Mr8Q";
const acmeChallengeValue =
  "lr7rW1s_1wm7pxa65J6ji6bHgjTqBhNBp3mNbN_Mr8Q.SoU9ySdwmIzA9IM4b8d63LTRqTIxAXyTcK1lsKjlUNQ";

const whitelist = process.env
  .CORS_ORIGINS!.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  credentials: true,
  origin: function (origin: any, callback: any) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not Allowed by CORS"));
    }
  },
};

app.use(morgan("combined")); // Use 'combined' for detailed logging, or 'dev' for concise output in development
if (tracingEnabled) {
  app.use(
    xrayExpress.openSegment(
      process.env.AWS_XRAY_TRACING_NAME || "jawsight-backend",
    ),
  );
}
app.use(passport.initialize());
app.use(cors(corsOptions));

app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(compression() as any);
app.use(express.text());

app.get("/.well-known/acme-challenge", (req, res) => {
  res.status(200).type("text/plain").send(acmeChallengeValue);
});

app.get("/.well-known/acme-challenge/", (req, res) => {
  res.status(200).type("text/plain").send(acmeChallengeValue);
});

app.get("/.well-known/acme-challenge/:token", (req, res) => {
  if (req.params.token !== acmeChallengeToken) {
    res.sendStatus(404);
    return;
  }

  res.status(200).type("text/plain").send(acmeChallengeValue);
});

// Mount main routes
app.use("/api", mainRouter);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/check-db", async (req, res) => {
  try {
    await db.sequelize.authenticate();
    res.status(200).json({ status: "Database is connected" });
  } catch (error) {
    console.error("Error checking database connection:", error);
    res
      .status(500)
      .json({ status: "Error connecting to database", error: error });
  }
});

app.get("/env", (req, res) => {
  res.status(200).json({ processEnv: process.env });
});

if (tracingEnabled) {
  app.use(xrayExpress.closeSegment());
}

app.use(errorConverter);
app.use(errorHandler);

export default app;
