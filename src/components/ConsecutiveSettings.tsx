interface Props {
  consecutiveBase: string;
  setConsecutiveBase: (val: string) => void;
  stopButton: boolean;
  setStopButton: (val: boolean) => void;
  stopTimerButton: boolean;
  setStopTimerButton: (val: boolean) => void;
  setConsecutiveTime: (val: number) => void;
  setDateReminder: (val: string) => void;
  setTimeReminder: (val: string) => void;
}

function ConsecutiveSettings({
  consecutiveBase,
  setConsecutiveBase,
  stopButton,
  setStopButton,
  stopTimerButton,
  setStopTimerButton,
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
              onChange={(e) => setTimeReminder(e.target.value)}
            />
            <label htmlFor="start_time_ontime">Start Time</label>
          </div>
          <div className="input-field col s12">
            <input
              id="consecutive_time"
              type="number"
              onChange={(e) =>
                setConsecutiveTime(parseInt(e.target.value) || 0)
              }
            />
            <label htmlFor="consecutive_time">Timer (minutes)</label>
          </div>
          <div className="col s12 left-align">
            <label>
              <input
                type="checkbox"
                className="filled-in"
                checked={stopButton}
                onChange={(e) => setStopButton(e.target.checked)}
              />
              <span>Adding Stop Button</span>
            </label>
          </div>
          {stopButton && (
            <div className="col s12 left-align">
              <label>
                <input
                  type="checkbox"
                  className="filled-in"
                  checked={stopTimerButton}
                  onChange={(e) => setStopTimerButton(e.target.checked)}
                />
                <span>Apply Timer After Stop</span>
              </label>
            </div>
          )}
        </>
      )}
      {consecutiveBase === "date" && (
        <>
          <div className="input-field col s12">
            <input
              id="start_date"
              type="text"
              className="datepicker"
              onChange={(e) => setDateReminder(e.target.value)}
            />
            <label htmlFor="start_date">Start Date</label>
          </div>
          <div className="input-field col s12">
            <input
              id="start_time_ondate"
              type="text"
              className="timepicker"
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
