"use client";
import Header from "@/components/shared/misc/Header";
import style from "./page.module.scss";
import { useParams } from "next/navigation";

export default function SoloSessionPage() {
  const { sessionID } = useParams();
  return (
    <div className={style.page}>
      <Header />
    </div>
  );
}
