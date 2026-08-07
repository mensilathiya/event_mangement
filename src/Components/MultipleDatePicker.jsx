import { useEffect, useRef, useState } from "react";
import { FaRegCalendarAlt } from "react-icons/fa";
import "../assets/CSS/MultipleDatePicker.css";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";
const MultipleDatePicker = ({
    value = [],
    onChange,
    placeholder = "Select Allow Dates",
}) => {
    const [open, setOpen] = useState(false);

    const wrapperRef = useRef(null);
    const [tempDates, setTempDates] = useState(value);

    useEffect(() => {
        setTempDates(value);
    }, [value]);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () =>
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
    }, []);

    return (
        <div
            className="multipleDatePicker"
            ref={wrapperRef}
        >
            <div
                className="multipleDatePicker-input"
                onClick={() => setOpen(true)}
            >
                <input
                    type="text"
                    readOnly
                    value={
                        value.length
                            ? value.map((date) => format(date, "dd/MM/yyyy")).join(", ")
                            : ""
                    }
                    placeholder={placeholder}
                />

                <FaRegCalendarAlt className="calendarIcon" />
            </div>

            {open && (
                <div className="multipleDatePicker-popup">

                    <DayPicker
                        mode="multiple"
                        selected={tempDates}
                        onSelect={(dates) => setTempDates(dates || [])}
                        showOutsideDays
                    />
                    <div className="multipleDatePicker-footer">
                        <button
                            type="button"
                            className="multipleDatePicker-cancel"
                            onClick={() => {
                                setTempDates(value);
                                setOpen(false);
                            }}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="multipleDatePicker-apply"
                            onClick={() => {
                                onChange(tempDates);
                                setOpen(false);
                            }}
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default MultipleDatePicker;