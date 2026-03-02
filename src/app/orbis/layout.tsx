import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-open-sans",
});

export const metadata: Metadata = {
  title: "化粧品・スキンケア・基礎化粧品の通販｜オルビス公式オンラインショップ",
};

export default function OrbisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${openSans.variable}`}
      style={{
        fontFamily:
          '"Open Sans", "游ゴシック体", YuGothic, "游ゴシック Medium", "Yu Gothic Medium", "YuGothic Medium", "游ゴシック", "Yu Gothic", "ヒラギノ角ゴ Pro W3", "Hiragino Kaku Gothic Pro", "メイリオ", Meiryo, sans-serif',
      }}
    >
      {children}
    </div>
  );
}
