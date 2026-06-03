import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ホットクック献立プランナー",
  description: "忙しい子育て世帯向けの1週間夕飯献立アプリ",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#f7b267",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
