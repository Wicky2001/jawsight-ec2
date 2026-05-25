import AWSXRay from "aws-xray-sdk";
import http from "http";
import https from "https";

export const tracingEnabled =
  process.env.NODE_ENV === "production" &&
  process.env.AWS_XRAY_ENABLED === "true";

if (tracingEnabled) {
  if (process.env.AWS_XRAY_DAEMON_ADDRESS) {
    AWSXRay.setDaemonAddress(process.env.AWS_XRAY_DAEMON_ADDRESS);
  }

  AWSXRay.captureHTTPsGlobal(http);
  AWSXRay.captureHTTPsGlobal(https);
}

export default AWSXRay;
