import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "react-email";

export type ExamAccessCodeEmailProps = {
  examTitle: string;
  accessCode: string;
  appUrl?: string;
};

const colors = {
  page: "#f8fafc",
  card: "#ffffff",
  border: "#e2e8f0",
  mutedBorder: "#f1f5f9",
  primary: "#2563eb",
  primarySoft: "#eff6ff",
  text: "#0f172a",
  muted: "#64748b",
  subtle: "#94a3b8",
};

export function ExamAccessCodeEmail({
  examTitle,
  accessCode,
  appUrl = "https://examproctolite.online",
}: ExamAccessCodeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Use code {accessCode} to access {examTitle}.</Preview>
      <Body
        style={{
          margin: 0,
          backgroundColor: colors.page,
          color: colors.text,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <Container
          style={{
            margin: "0 auto",
            maxWidth: "560px",
            padding: "32px 20px",
          }}
        >
          <Section
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: "28px",
              backgroundColor: colors.card,
              overflow: "hidden",
            }}
          >
            <Section style={{ padding: "28px 28px 20px" }}>
              <Text
                style={{
                  margin: "0 0 20px",
                  color: colors.primary,
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                ExamProctorLite
              </Text>
              <Heading
                as="h1"
                style={{
                  margin: 0,
                  color: colors.text,
                  fontSize: "28px",
                  lineHeight: "34px",
                  letterSpacing: "-0.02em",
                }}
              >
                You have been invited to an exam
              </Heading>
              <Text
                style={{
                  margin: "12px 0 0",
                  color: colors.muted,
                  fontSize: "15px",
                  lineHeight: "24px",
                }}
              >
                Use the access code below to attach your account to{" "}
                <strong style={{ color: colors.text }}>{examTitle}</strong>.
              </Text>
            </Section>

            <Section style={{ padding: "0 28px" }}>
              <Section
                style={{
                  border: `1px solid ${colors.mutedBorder}`,
                  borderRadius: "22px",
                  backgroundColor: colors.primarySoft,
                  padding: "24px",
                  textAlign: "center",
                }}
              >
                <Text
                  style={{
                    margin: "0 0 8px",
                    color: colors.subtle,
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Access code
                </Text>
                <Text
                  style={{
                    margin: 0,
                    color: colors.text,
                    fontFamily: '"SFMono-Regular", Consolas, monospace',
                    fontSize: "34px",
                    fontWeight: 800,
                    letterSpacing: "0.22em",
                  }}
                >
                  {accessCode}
                </Text>
              </Section>
            </Section>

            <Section style={{ padding: "22px 28px 28px" }}>
              <Text
                style={{
                  margin: 0,
                  color: colors.muted,
                  fontSize: "14px",
                  lineHeight: "22px",
                }}
              >
                Sign in or create your account, then enter this code when asked
                for your exam access code.
              </Text>
              <Text
                style={{
                  margin: "16px 0 0",
                  color: colors.primary,
                  fontSize: "14px",
                  fontWeight: 700,
                  lineHeight: "22px",
                }}
              >
                {appUrl}
              </Text>
              <Hr
                style={{
                  border: "none",
                  borderTop: `1px solid ${colors.mutedBorder}`,
                  margin: "24px 0 16px",
                }}
              />
              <Text
                style={{
                  margin: 0,
                  color: colors.subtle,
                  fontSize: "12px",
                  lineHeight: "18px",
                }}
              >
                If you were not expecting this exam invitation, you can ignore
                this email.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
