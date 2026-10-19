import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import style from "@/components/clip/Author.module.scss";
import { useClipContext } from "@/components/clip/context";
import { User } from "@/lib/models/user";

export default function ClipAuthor() {
  const router = useRouter();
  const { clip, users } = useClipContext();
  const [author, setAuthor] = useState<User | null>(null);

  useEffect(() => {
    users.find(clip.authorID).then(setAuthor);
  }, [clip.authorID]);

  const searchClipsByAuthor = useCallback(() => {
    router.push(`/library?author=${clip.authorID}`);
  }, [clip.authorID]);

  return (
    <div className={style.container} onClick={searchClipsByAuthor}>
      {author ? (
        <>
          <span className={style.at}>by @</span>
          <span className={style.name}>{author.name}</span>
        </>
      ) : (
        "by Anonymous user"
      )}
    </div>
  );
}
