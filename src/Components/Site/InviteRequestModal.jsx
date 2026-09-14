import { useEffect, useRef, useState } from "react";

// Same Google Apps Script Web App endpoint the "Join Community" form
// already uses (Pages/Site/Contact.jsx) — kept as its own local
// constant here (not imported from Contact.jsx) so this modal has no
// dependency on that file and nothing there needs to change. Submitting
// here sends data to the SAME Google Sheet, using the SAME field names
// Contact.jsx already sends (firstName/lastName/email/phone/profession/
// reason), so no change is needed on the Apps Script/sheet side either:
//  - "phone" carries the normalized WhatsApp number (see
//    normalizeWhatsapp below) — same column Contact.jsx's phone number
//    already lands in.
//  - "source" is one extra field ("parv-invite") so rows from this form
//    can be told apart from Contact.jsx's; if the sheet script only
//    reads specific known fields, this one is simply ignored — it can't
//    break the existing submissions.
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzTLbM0mBsz26vMuowccj0_kiW2Erm5UzYR54T21dNIILibU6wiWQEbiHRaBVA_Tvsq/exec";

// First-pass list — the user said they'll finalize these options
// themselves, so this is a reasonable starting set, not final copy.
const PROFESSION_OPTIONS = [
  "Business Owner / Entrepreneur",
  "Working Professional",
  "Freelancer / Consultant",
  "Student",
  "Homemaker",
  "Other",
];

// Accepts a WhatsApp number with or without a country code and always
// sends it to the sheet as +91XXXXXXXXXX — so the person filling the
// form is never required to type +91 themselves (the hint under the
// field says so), but the sheet still gets a consistent, dialable
// format either way.
const normalizeWhatsapp = (value) => {
  const stripped = String(value || "").replace(/[^\d+]/g, "");
  if (stripped.startsWith("+")) return stripped;

  const withoutLeadingZero = stripped.replace(/^0+/, "");
  // Already has the country code, just missing the "+" (e.g. "919876543210").
  if (withoutLeadingZero.startsWith("91") && withoutLeadingZero.length > 10) {
    return `+${withoutLeadingZero}`;
  }
  return `+91${withoutLeadingZero}`;
};

/**
 * "Request Invitation" / "Request Your Invitation" modal for the Parv
 * page. Visually the same "Join Community" card as Pages/Site/
 * Contact.jsx (reuses its .join-section/.join-card/... CSS as-is —
 * nothing there was touched) but opens as an overlay on the current
 * page instead of navigating to a separate route, wrapped in its own
 * .invite-modal overlay (styled after the existing .event-modal
 * lightbox pattern).
 *
 * Field differences from the Join Community form, per what was asked:
 *  - WhatsApp Number instead of Phone Number (accepts with/without +91)
 *  - Profession / Role is a dropdown instead of free text
 *
 * Props:
 *  - open: boolean — modal shown when true
 *  - onClose: () => void
 */
export default function InviteRequestModal({ open, onClose }) {
  const formRef = useRef(null);
  const [status, setStatus] = useState({ visible: false, color: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  // Lock page scroll behind the modal while it's open (same behavior as
  // EventGalleryModal.jsx).
  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape closes, same as EventGalleryModal.jsx.
  useEffect(() => {
    if (!open) return undefined;
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Reset any leftover status message from a previous open.
  useEffect(() => {
    if (!open) {
      setStatus({ visible: false, color: "", message: "" });
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = formRef.current;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setSubmitting(true);
    setStatus({ visible: true, color: "#F4DD4E", message: "Sending your request..." });

    const formData = new FormData(form);
    formData.set("phone", normalizeWhatsapp(formData.get("whatsapp")));
    formData.delete("whatsapp");
    formData.set("source", "parv-invite");

    try {
      // no-cors: request Google tak pahunch jaata hai aur sheet me save
      // ho jaata hai. Response opaque hota hai (read nahi kar sakte),
      // isliye reach = success maante hain — same assumption
      // Contact.jsx already makes for the same endpoint.
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: formData,
      });
      setStatus({
        visible: true,
        color: "#F4DD4E",
        message: "Thanks! Your invitation request has been submitted.",
      });
      form.reset();
    } catch (err) {
      setStatus({
        visible: true,
        color: "#ff6b6b",
        message: "Network error. Please check your connection and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="invite-modal active">
      <div className="invite-modal-overlay" onClick={onClose}></div>

      <div className="invite-modal-content">
        <div className="join-card" data-aos="zoom-in">
          <button type="button" className="join-close" aria-label="Close" onClick={onClose}>
            &times;
          </button>

          <div className="join-badge">&#9733;</div>

          <h1 className="join-title">
            REQUEST YOUR
            <br />
            INVITATION
          </h1>
          <p className="join-tagline">
            RESERVE YOUR SPOT AT GUJARAT'S MOST ANTICIPATED EVENING GATHERINGS
          </p>

          <form className="join-form" ref={formRef} onSubmit={handleSubmit} noValidate>
            <div className="join-row">
              <input type="text" name="firstName" placeholder="FIRST NAME *" aria-label="First name" required />
              <input type="text" name="lastName" placeholder="LAST NAME *" aria-label="Last name" required />
            </div>

            <input type="email" name="email" placeholder="EMAIL ADDRESS *" aria-label="Email address" required />

            <div>
              <input
                type="tel"
                name="whatsapp"
                placeholder="WHATSAPP NUMBER *"
                aria-label="WhatsApp number"
                required
              />
              <p className="join-hint">You can enter it with or without +91 — either way works.</p>
            </div>

            <select name="profession" aria-label="Profession / Role" required defaultValue="">
              <option value="" disabled>
                SELECT PROFESSION / ROLE *
              </option>
              {PROFESSION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <textarea
              name="reason"
              rows={4}
              placeholder="WHY DO YOU WANT TO JOIN PARV? *"
              aria-label="Why do you want to join Parv?"
              required
            ></textarea>

            <div className="join-actions">
              <button type="submit" className="join-submit" disabled={submitting}>
                {submitting ? "Submitting..." : <>Submit Request &rarr;</>}
              </button>
            </div>
            {status.visible && (
              <p className="join-status" style={{ color: status.color }}>
                {status.message}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}