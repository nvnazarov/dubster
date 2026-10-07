import { useCallback } from "react";
import { Button } from "../shared/html/Button";
import { useSession } from "./context";

export default function PreviousPageButton() {
  const session = useSession();

  const handleClick = useCallback(() => {
    session.previous();
  }, []);

  return <Button text="Previous" onClick={handleClick} />;
}
