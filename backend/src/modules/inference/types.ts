export type UploadedDataObject = {
  doctor_id: number;
  patient_id: number;
  iterationId: string;
  image_id?: string;

  input_images_details: {
    side: string;
    bucket_key: string;
    csv_key?: string;
    image_id?: string;
  }[];
};
