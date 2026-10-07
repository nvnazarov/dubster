import { useCallback } from "react";
import { Button } from "../shared/html/Button";
import { useSession } from "./context";

export default function NextPageButton() {
  const session = useSession();

  const handleClick = useCallback(() => {
    session.next();
  }, []);

  return <Button text="Next" onClick={handleClick} primary />;
}
