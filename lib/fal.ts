import * as fal from "@fal-ai/serverless-client";

fal.config({
  credentials: process.env.FAL_KEY!,
});

export async function generateImage(prompt: string): Promise<string> {
  const result = await fal.subscribe("fal-ai/flux/schnell", {
    input: {
      prompt,
      image_size: "square_hd",
      num_inference_steps: 4,
      num_images: 1,
    },
  }) as { images: { url: string }[] };

  return result.images[0].url;
}
