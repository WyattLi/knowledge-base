import COS from "cos-nodejs-sdk-v5";

function getCosClient() {
  const secretId = process.env.COS_SECRET_ID;
  const secretKey = process.env.COS_SECRET_KEY;

  if (!secretId || !secretKey) {
    throw new Error("COS_SECRET_ID and COS_SECRET_KEY must be set in .env");
  }

  return new COS({ SecretId: secretId, SecretKey: secretKey });
}

const BUCKET = process.env.COS_BUCKET || "";
const REGION = process.env.COS_REGION || "ap-guangzhou";

function cosPut(key: string, body: Buffer | string, contentType = "text/markdown"): Promise<void> {
  return new Promise((resolve, reject) => {
    getCosClient().putObject(
      { Bucket: BUCKET, Region: REGION, Key: key, Body: body, ContentType: contentType },
      (err) => (err ? reject(err) : resolve()),
    );
  });
}

function cosGet(key: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    getCosClient().getObject(
      { Bucket: BUCKET, Region: REGION, Key: key },
      (err, data) => (err ? reject(err) : resolve(data.Body as Buffer)),
    );
  });
}

function cosDelete(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    getCosClient().deleteObject(
      { Bucket: BUCKET, Region: REGION, Key: key },
      (err) => (err ? reject(err) : resolve()),
    );
  });
}

function cosList(prefix: string): Promise<COS.CosObject[]> {
  return new Promise((resolve, reject) => {
    getCosClient().getBucket(
      { Bucket: BUCKET, Region: REGION, Prefix: prefix },
      (err, data) => (err ? reject(err) : resolve(data.Contents || [])),
    );
  });
}

export { cosPut, cosGet, cosDelete, cosList };
