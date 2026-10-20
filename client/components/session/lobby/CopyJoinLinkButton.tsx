import { useCallback } from "react";

import Button from "@/components/shared/html/Button";

export default function CopyJoinLinkButton() {
  const copyJoinLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
  }, []);

  return <Button text="Copy join link" onClick={copyJoinLink} />;
}
