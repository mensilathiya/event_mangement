import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Html5Qrcode } from "html5-qrcode";

import {
  verifyQr,
  checkInQr,
} from "../../redux/qr/qrThunk";
import {
  clearQrTicket,
  clearQrError,
  clearQrSuccess,
  selectVerifyLoading,
  selectVerifySuccess,
  selectVerifyError,
  selectCheckInLoading,
  selectCheckInSuccess,
  selectCheckInError,
  selectQrTicket,
} from "../../redux/qr/qrSlice";

import "./QRScannerModal.css";

const SCANNER_ELEMENT_ID = "qr-scanner-region";

/* =========================================================
   Inline line-icons (no external icon library dependency)
   Purely decorative — the visible title/message carries the
   meaning, so every icon is aria-hidden.
   ========================================================= */
const IconIndicator = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const IconClock = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconBan = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </svg>
);

const IconCalendarOff = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="9" y1="14" x2="15" y2="18" />
    <line x1="15" y1="14" x2="9" y2="18" />
  </svg>
);

const IconCheck = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 17" />
  </svg>
);

/* =========================================================
   Result-state configuration
   Maps each outcome to its icon, color modifier, title, and message.
   Defined outside the component so it is never recreated on render.
   ========================================================= */
const RESULT_CONFIG = {
  loading: {
    title: "Verifying Ticket",
    message: "Please wait while we confirm this ticket.",
    colorClass: "crmQrResultIconLoading",
    Icon: null, // renders the spinner instead of a static icon
  },
  invalid: {
    title: "Invalid QR Code",
    message:
      "We couldn't recognize this ticket. Please try scanning again or use a valid event ticket.",
    colorClass: "crmQrResultIconInvalid",
    Icon: IconIndicator,
  },
  used: {
    title: "Ticket Already Used",
    message: "This ticket has already been checked in and cannot be used again.",
    colorClass: "crmQrResultIconUsed",
    Icon: IconClock,
  },
  cancelled: {
    title: "Ticket Cancelled",
    message: "This booking was cancelled and is not valid for entry.",
    colorClass: "crmQrResultIconCancelled",
    Icon: IconBan,
  },
  expired: {
    title: "Event Has Expired",
    message: "This ticket belongs to an event that has already ended.",
    colorClass: "crmQrResultIconExpired",
    Icon: IconCalendarOff,
  },
};

/* Best-effort classification from the verify error message, since
   redux only exposes a plain string via rejectWithValue. */
const classifyErrorMessage = (message) => {
  const msg = (message || "").toLowerCase();
  if (msg.includes("expire")) return "expired";
  if (msg.includes("cancel")) return "cancelled";
  if (msg.includes("used") || msg.includes("already")) return "used";
  return "invalid";
};

/* Best-effort classification from the verified ticket payload,
   tolerant of a few likely field-name shapes. */
const classifyTicketStatus = (ticket) => {
  if (!ticket) return "valid";
  if (ticket.isCancelled) return "cancelled";
  if (ticket.isExpired || ticket.eventExpired) return "expired";
  if (ticket.isUsed) return "used";

  const status = (ticket.status || "").toLowerCase();
  if (status.includes("cancel")) return "cancelled";
  if (status.includes("expire")) return "expired";
  if (status.includes("used")) return "used";
  return "valid";
};

/* Prefers a back/environment-facing camera; falls back to the first
   available device. Pure function — no component state involved. */
const pickBackCamera = (deviceList) => {
  if (!deviceList || deviceList.length === 0) return null;
  const backCamera = deviceList.find((device) =>
    /back|rear|environment/i.test(device.label)
  );
  return backCamera ? backCamera.id : deviceList[0].id;
};

/**
 * QRScannerModal
 *
 * - Mounts the html5-qrcode scanner only while `isOpen` is true.
 * - Auto-selects the back/environment-facing camera when available.
 * - Lets the user switch between available cameras.
 * - Stops the camera stream immediately after a successful decode,
 *   then dispatches verifyQr with the decoded payload.
 * - Renders one of five distinct result states after a scan attempt:
 *   Loading, Invalid QR, Used Ticket, Cancelled Ticket, Event Expired —
 *   each with its own icon, color, and message — or the verified
 *   ticket card (Name, Mobile, Booking No., Ticket, Event, Date, Status)
 *   with Allow Entry / Scan Next / Close actions.
 * - Fully tears down the scanner (stop + clear) on close/unmount and
 *   resets all local camera state to avoid stale state and memory leaks.
 * - Traps focus while open, restores it on close, and closes on Escape.
 */
const QRScannerModal = ({ isOpen, onClose, onVerified, onCheckedIn }) => {
  const dispatch = useDispatch();

  const verifyLoading = useSelector(selectVerifyLoading);
  const verifySuccess = useSelector(selectVerifySuccess);
  const verifyError = useSelector(selectVerifyError);

  const checkInLoading = useSelector(selectCheckInLoading);
  const checkInSuccess = useSelector(selectCheckInSuccess);
  const checkInError = useSelector(selectCheckInError);

  const ticket = useSelector(selectQrTicket);

  const [cameras, setCameras] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // Instance + lifecycle refs (avoid stale closures / state-after-unmount)
  const scannerRef = useRef(null);
  const isMountedRef = useRef(true);
  const hasScannedRef = useRef(false);
  const modalRef = useRef(null);
  const previouslyFocusedElementRef = useRef(null);

  // ---------- derived result state ----------

  const resultState = useMemo(() => {
    if (verifyLoading) return "loading";
    if (verifyError) return classifyErrorMessage(verifyError);
    if (verifySuccess && ticket) return classifyTicketStatus(ticket);
    return null; // still scanning, no verify attempt resolved yet
  }, [verifyLoading, verifyError, verifySuccess, ticket]);

  const isValidTicket = resultState === "valid";
  const isBlockedResult =
    resultState === "invalid" ||
    resultState === "used" ||
    resultState === "cancelled" ||
    resultState === "expired";

  const resultConfig = resultState ? RESULT_CONFIG[resultState] : null;

  // ---------- scanner lifecycle helpers ----------

  const stopScanner = useCallback(async () => {
    const instance = scannerRef.current;
    if (!instance) return;

    try {
      if (instance.isScanning) {
        await instance.stop();
      }
      await instance.clear();
    } catch (err) {
      // Swallow — element may already be torn down (e.g. modal closed fast)
    } finally {
      scannerRef.current = null;
      if (isMountedRef.current) {
        setIsScanning(false);
      }
    }
  }, []);

  const handleDecodedText = useCallback(
    async (decodedText) => {
alert(JSON.stringify(decodedText));
      // Prevent multiple fires from rapid consecutive frame decodes
      if (hasScannedRef.current) return;
      hasScannedRef.current = true;

      await stopScanner();
      if (!isMountedRef.current) return;

      dispatch(verifyQr({ qrData: decodedText }))
        .unwrap()
        .then((result) => {
          if (onVerified) onVerified(result);
        })
        .catch(() => {
          // Error is already captured in redux state (verify.error)
        });
    },
    [dispatch, onVerified, stopScanner]
  );

  const startScanner = useCallback(
    async (cameraId) => {
      if (!cameraId) return;

      await stopScanner();
      if (!isMountedRef.current) return;

      try {
        const instance = new Html5Qrcode(SCANNER_ELEMENT_ID);
        scannerRef.current = instance;
        hasScannedRef.current = false;
        await instance.start(
          {
            deviceId: {
              exact: cameraId
            }
          },
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 250
            },
            aspectRatio: 1.777778
          },
          handleDecodedText,
          undefined
        );

        if (isMountedRef.current) {
          setIsScanning(true);
          setCameraError(null);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setCameraError("Unable to start camera. Please check permissions.");
          setIsScanning(false);
        }
      }
    },
    [handleDecodedText, stopScanner]
  );

  const handleCameraChange = useCallback(
    (event) => {
      const newCameraId = event.target.value;
      setActiveCameraId(newCameraId);
      startScanner(newCameraId);
    },
    [startScanner]
  );

  const resetVerificationState = useCallback(() => {
    dispatch(clearQrTicket());
    dispatch(clearQrError("all"));
    dispatch(clearQrSuccess("all"));
  }, [dispatch]);

  const handleClose = useCallback(async () => {
    await stopScanner();
    resetVerificationState();
    if (onClose) onClose();
  }, [stopScanner, resetVerificationState, onClose]);

  // "Scan Next": clear current result and restart the camera.
  // Used to recover from every non-valid result state as well.
  const handleScanNext = useCallback(async () => {
    resetVerificationState();
    await startScanner(activeCameraId);
  }, [resetVerificationState, startScanner, activeCameraId]);

  // "Allow Entry": check the ticket in using the existing checkInQr thunk
  const handleAllowEntry = useCallback(() => {
    if (!ticket) return;

    dispatch(checkInQr({ ticketId: ticket.id, qrData: ticket.qrData }))
      .unwrap()
      .then((result) => {
        if (onCheckedIn) onCheckedIn(result);
      })
      .catch(() => {
        // checkIn.error is already captured in redux state for display
      });
  }, [dispatch, ticket, onCheckedIn]);

  // ---------- lifecycle: mount tracking ----------

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ---------- lifecycle: camera init, scoped to isOpen ----------

  useEffect(() => {
    if (!isOpen) return undefined;

    let cancelled = false;

    const init = async () => {
      try {

        // Check browser support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraError("Camera is not supported on this browser.");
          return;
        }

        // Request permission first
        await navigator.mediaDevices.getUserMedia({
          video: true,
        });


        const deviceList = await Html5Qrcode.getCameras();

        if (cancelled || !isMountedRef.current) return;


        if (!deviceList || deviceList.length === 0) {
          setCameraError("No camera found on this device.");
          return;
        }


        setCameras(deviceList);

        const preferredCameraId = pickBackCamera(deviceList);

        setActiveCameraId(preferredCameraId);

        await startScanner(preferredCameraId);


      } catch (err) {

        console.log("Camera error:", err);

        if (err.name === "NotAllowedError") {
          setCameraError(
            "Camera permission denied. Please allow camera permission from browser settings."
          );
        }
        else if (err.name === "NotFoundError") {
          setCameraError("No camera available.");
        }
        else if (err.name === "NotReadableError") {
          setCameraError(
            "Camera is already in use by another application."
          );
        }
        else {
          setCameraError(
            "Camera permission denied or unavailable."
          );
        }
      }
    };

    init();

    // Cleanup runs when modal closes OR component unmounts:
    // stop the camera and reset local scan state so reopening
    // the modal never shows stale devices or a stuck spinner.
    return () => {
      cancelled = true;
      stopScanner();
      if (isMountedRef.current) {
        setCameras([]);
        setActiveCameraId(null);
        setCameraError(null);
      }
    };
  }, [isOpen, startScanner, stopScanner]);

  // ---------- lifecycle: focus trap + restore, Escape to close ----------

  useEffect(() => {
    if (!isOpen) return undefined;

    previouslyFocusedElementRef.current = document.activeElement;
    modalRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (
        previouslyFocusedElementRef.current &&
        typeof previouslyFocusedElementRef.current.focus === "function"
      ) {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="crmQrOverlay">
      <div
        className="crmQrModal"
        role="dialog"
        aria-modal="true"
        aria-label="QR Ticket Scanner"
        tabIndex={-1}
        ref={modalRef}
      >
        <div className="crmQrHeader">
          <div>
            <p className="crmQrHeaderTitle">
              {isValidTicket
                ? "Ticket Details"
                : resultState
                  ? "Scan Result"
                  : "Scan Ticket QR"}
            </p>
            <p className="crmQrHeaderSubtitle">
              {isValidTicket
                ? "Review details before allowing entry"
                : resultState
                  ? "Here's what we found"
                  : "Align the QR code within the frame"}
            </p>
          </div>
          <button
            type="button"
            className="crmQrCloseBtn"
            onClick={handleClose}
            aria-label="Close scanner"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {/* ---------------- Scanner view (idle / actively scanning) ---------------- */}
        {!resultState && (
          <>
            {cameras.length > 1 && (
              <div className="crmQrCameraBar">
                <label htmlFor="crmQrCameraSelect" className="crmQrSrOnly">
                  Select camera
                </label>
                <select
                  id="crmQrCameraSelect"
                  className="crmQrCameraSelect"
                  value={activeCameraId || ""}
                  onChange={handleCameraChange}
                  aria-label="Select camera"
                >
                  {cameras.map((camera) => (
                    <option key={camera.id} value={camera.id}>
                      {camera.label || camera.id}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="crmQrScannerWrapper">
              <div
                id={SCANNER_ELEMENT_ID}
                className="crmQrScannerRegion"
                aria-hidden="true"
              />

              {isScanning && (
                <div className="crmQrFrame" aria-hidden="true">
                  <div className="crmQrCorner crmQrCornerTl" />
                  <div className="crmQrCorner crmQrCornerTr" />
                  <div className="crmQrCorner crmQrCornerBl" />
                  <div className="crmQrCorner crmQrCornerBr" />
                  <div className="crmQrScanLine" />
                </div>
              )}
            </div>

            <div aria-live="polite">
              {!isScanning && !cameraError && (
                <p className="crmQrStatusText">Starting camera...</p>
              )}

              {cameraError && (
                <div className="crmQrErrorBox">
                  <p className="crmQrErrorText">{cameraError}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ---------------- Result states (Loading / Invalid / Used / Cancelled / Expired) ---------------- */}
        {resultState && !isValidTicket && (
          <div aria-live="polite" aria-busy={resultState === "loading"}>
            <div className="crmQrResultState">
              <div className={`crmQrResultIcon ${resultConfig.colorClass}`}>
                {resultConfig.Icon ? (
                  <resultConfig.Icon className="crmQrResultIconGlyph" />
                ) : (
                  <span className="crmQrResultSpinner" />
                )}
              </div>
              <p className="crmQrResultTitle">{resultConfig.title}</p>
              <p className="crmQrResultMessage">{resultConfig.message}</p>
            </div>

            {isBlockedResult && (
              <div className="crmQrActions">
                <button
                  type="button"
                  className="crmQrBtn crmQrBtnGhost"
                  onClick={handleClose}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="crmQrBtn crmQrBtnPrimary"
                  onClick={handleScanNext}
                >
                  Scan Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* ---------------- Verified ticket card ---------------- */}
        {isValidTicket && (
          <div aria-live="polite">
            <div className="crmQrCard">
              <div className="crmQrCardRow">
                <span className="crmQrCardLabel">Name</span>
                <span className="crmQrCardValue">{ticket?.name || "N/A"}</span>
              </div>

              <div className="crmQrCardRow">
                <span className="crmQrCardLabel">Mobile</span>
                <span className="crmQrCardValue">{ticket?.mobile || "N/A"}</span>
              </div>

              <div className="crmQrCardRow">
                <span className="crmQrCardLabel">Booking No.</span>
                <span className="crmQrCardValue">
                  {ticket?.bookingNumber || "N/A"}
                </span>
              </div>

              <div className="crmQrCardRow">
                <span className="crmQrCardLabel">Ticket</span>
                <span className="crmQrCardValue">
                  {ticket?.ticketType || ticket?.ticket || "N/A"}
                </span>
              </div>

              <div className="crmQrCardRow">
                <span className="crmQrCardLabel">Event</span>
                <span className="crmQrCardValue">
                  {ticket?.eventName || ticket?.event || "N/A"}
                </span>
              </div>

              <div className="crmQrCardRow">
                <span className="crmQrCardLabel">Date</span>
                <span className="crmQrCardValue">
                  {ticket?.eventDate || ticket?.date || "N/A"}
                </span>
              </div>

              <div className="crmQrCardRow">
                <span className="crmQrCardLabel">Status</span>
                <span className="crmQrStatusBadge">{ticket?.status || "Valid"}</span>
              </div>
            </div>

            {checkInError && (
              <div className="crmQrErrorBox">
                <p className="crmQrErrorText">{checkInError}</p>
              </div>
            )}

            {checkInSuccess && (
              <div className="crmQrSuccessBox">
                <IconCheck className="crmQrSuccessIcon" />
                <p className="crmQrSuccessText">Entry allowed successfully.</p>
              </div>
            )}

            <div className="crmQrActions">
              <button
                type="button"
                className="crmQrBtn crmQrBtnGhost"
                onClick={handleClose}
              >
                Close
              </button>

              <button
                type="button"
                className="crmQrBtn crmQrBtnGhost"
                onClick={handleScanNext}
                disabled={checkInLoading}
              >
                Scan Next
              </button>

              <button
                type="button"
                className="crmQrBtn crmQrBtnPrimary"
                onClick={handleAllowEntry}
                disabled={checkInLoading || checkInSuccess}
              >
                {checkInLoading ? "Allowing..." : "Allow Entry"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScannerModal;
