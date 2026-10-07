"use client";
import Header from "@/components/shared/misc/Header";
import styles from "./page.module.scss";

export default function Home() {
  return (
    <div className={styles.page}>
      <Header />
      <p>Welcome to Dubster!</p>
    </div>
  );
}
