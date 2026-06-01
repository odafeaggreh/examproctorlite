import { google } from "googleapis";
import { NextResponse } from "next/server";

// Initialize Google Forms API client
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/forms.responses.readonly"],
});

const forms = google.forms({
  version: "v1",
  auth,
});

export async function GET() {
  try {
    const formId = process.env.GOOGLE_FORM_ID;

    if (!formId) {
      return NextResponse.json(
        { error: "Form ID not configured" },
        { status: 500 }
      );
    }

    // Get form details
    const form = await forms.forms.get({
      formId,
    });

    return NextResponse.json(form.data);
  } catch (error) {
    console.error("Error fetching form:", error);
    return NextResponse.json(
      { error: "Failed to fetch form details" },
      { status: 500 }
    );
  }
}
