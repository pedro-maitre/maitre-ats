import OpenAI from "openai";
import { config } from "dotenv";
config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Retorne um JSON: {"status": "ok"}`
        },
        {
          role: "user",
          content: "Teste"
        }
      ],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
    });

    console.log("Success:", completion.choices[0].message.content);
  } catch (error: any) {
    console.error("OpenAI Error:", error.message);
  }
}

main();
