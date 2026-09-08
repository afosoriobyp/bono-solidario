import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand
} from "@aws-sdk/client-s3";

export function r2Configurado(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET &&
      process.env.R2_PUBLIC_URL
  );
}

let cliente: S3Client | null = null;

function getCliente(): S3Client {
  if (!cliente) {
    cliente = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string
      },
      forcePathStyle: true
    });
  }
  return cliente;
}

export async function subirArchivoR2(opts: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<void> {
  await getCliente().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET as string,
      Key: opts.key,
      Body: opts.body,
      ContentType: opts.contentType
    })
  );
}

export async function eliminarArchivoR2(key: string): Promise<void> {
  await getCliente().send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET as string,
      Key: key
    })
  );
}

export function urlPublicaR2(key: string): string {
  const base = (process.env.R2_PUBLIC_URL as string).replace(/\/+$/, "");
  return `${base}/${key}`;
}