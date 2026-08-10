import { useEffect, useRef } from "react";

export default function useEventExpiryRefetch(endDateTime, onExpire) {
  const onExpireRef = useRef(onExpire);
  const firedRef = useRef(false);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    firedRef.current = false;

    console.log("[expiry-hook] effect", {
      endDateTime,
      now: new Date().toISOString(),
    });

    if (!endDateTime) {
      console.log("[expiry-hook] no endDateTime");
      return;
    }

    const endTime = new Date(endDateTime).getTime();

    if (Number.isNaN(endTime)) {
      console.log("[expiry-hook] invalid endDateTime");
      return;
    }

    const remainingTime = endTime - Date.now();

    console.log("[expiry-hook] calculated", {
      endTime: new Date(endTime).toISOString(),
      now: new Date().toISOString(),
      remainingTime,
      remainingSeconds: Math.round(remainingTime / 1000),
    });

    const triggerExpire = (source) => {
      if (firedRef.current) {
        console.log("[expiry-hook] already fired", source);
        return;
      }

      firedRef.current = true;

      console.log("[expiry-hook] FIRED", {
        source,
        now: new Date().toISOString(),
        endTime: new Date(endTime).toISOString(),
      });

      onExpireRef.current?.();
    };

    if (remainingTime <= 0) {
      triggerExpire("already-expired");
      return;
    }

    const timerId = window.setTimeout(() => {
      triggerExpire("setTimeout");
    }, remainingTime);

    console.log("[expiry-hook] timer scheduled", {
      delay: remainingTime,
      delaySeconds: Math.round(remainingTime / 1000),
    });

    const handleVisibilityChange = () => {
      console.log("[expiry-hook] visibility change", {
        visibilityState: document.visibilityState,
        now: new Date().toISOString(),
      });

      if (document.visibilityState !== "visible") {
        return;
      }

      if (Date.now() >= endTime) {
        triggerExpire("visibilitychange");
      }
    };

    const handleFocus = () => {
      console.log("[expiry-hook] window focus", {
        now: new Date().toISOString(),
      });

      if (Date.now() >= endTime) {
        triggerExpire("focus");
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener("focus", handleFocus);

    return () => {
      console.log("[expiry-hook] cleanup");

      window.clearTimeout(timerId);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener("focus", handleFocus);
    };
  }, [endDateTime]);
}