import * as ImageManipulator from 'expo-image-manipulator';
import { CONFIG } from '../../constants';

/** Resize + compress before upload to control AI cost. Returns base64 JPEG. */
export async function prepareImage(uri: string): Promise<{ base64: string; mime: string }> {
  const out = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: CONFIG.MAX_IMAGE_EDGE } }],
    { compress: CONFIG.IMAGE_QUALITY, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  if (!out.base64) throw new Error('Could not read image');
  return { base64: out.base64, mime: 'image/jpeg' };
}
