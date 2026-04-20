interface Props {
  consecutiveBase: string;
  consecutiveTime: number;
  startDate: string;
  startTime: string;
  setConsecutiveBase: (val: string) => void;
  setConsecutiveTime: (val: number) => void;
  setDateReminder: (val: string) => void;
  setTimeReminder: (val: string) => void;
}

function ConsecutiveSettings({
  consecutiveBase,
  consecutiveTime,
  startDate,
  startTime,
  setConsecutiveBase,
  setConsecutiveTime,
  setDateReminder,
  setTimeReminder,
}: Props) {
  return (
    <div>
      <div className="input-field col s12">
        <select
          id="consecutive_base"
          value={consecutiveBase}
          onChange={(e) => setConsecutiveBase(e.target.value)}
        >
          <option value="" disabled>
            Choose Based on
          </option>
          <option value="time">Time</option>
          <option value="date">Date</option>
        </select>
        <label htmlFor="consecutive_base">Based on</label>
      </div>
      {consecutiveBase === "time" && (
        <>
          <div className="input-field col s12">
            <input
              id="start_time_ontime"
              type="text"
              className="timepicker"
              value={startTime}
              onChange={(e) => setTimeReminder(e.target.value)}
            />
            <label htmlFor="start_time_ontime">Start Time</label>
          </div>
          <div className="input-field col s12">
            <input
              id="consecutive_time"
              type="number"
              value={consecutiveTime || ""}
              onChange={(e) =>
                setConsecutiveTime(parseInt(e.target.value) || 0)
              }
            />
            <label htmlFor="consecutive_time">Every (minutes)</label>
          </div>
        </>
      )}
      {consecutiveBase === "date" && (
        <>
          <div className="input-field col s12">
            <input
              id="start_date"
              type="text"
              className="datepicker"
              value={startDate}
              onChange={(e) => setDateReminder(e.target.value)}
            />
            <label htmlFor="start_date">Start Date</label>
          </div>
          <div className="input-field col s12">
            <input
              id="start_time_ondate"
              type="text"
              className="timepicker"
              value={startTime}
              onChange={(e) => setTimeReminder(e.target.value)}
            />
            <label htmlFor="start_time_ondate">Start Time</label>
          </div>
        </>
      )}
    </div>
  );
}

export default ConsecutiveSettings;
