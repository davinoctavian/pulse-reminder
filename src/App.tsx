import { useState, useEffect } from "react";
import "./App.css";
import M from "materialize-css";

function App() {
  const [reminders, setReminders] = useState([]);
  const [reminderType, setReminderType] = useState("");
  const [consecutiveBase, setConsecutiveBase] = useState("");
  const [stopButton, setStopButton] = useState(false);
  const [stopTimerButton, setStopTimerButton] = useState(false);
  useEffect(() => {
    const elems = document.querySelectorAll(".tooltipped");
    const modalElems = document.querySelectorAll(".modal");
    const selectElems = document.querySelectorAll("select");
    M.FormSelect.init(selectElems);
    M.Tooltip.init(elems);
    M.Modal.init(modalElems);
  }, []);

  useEffect(() => {
    const selectElems = document.querySelectorAll("select");
    M.FormSelect.init(selectElems);

    const dateElems = document.querySelectorAll(".datepicker");
    const timeElems = document.querySelectorAll(".timepicker");
    M.Datepicker.init(dateElems, {
      format: "yyyy-mm-dd",
      autoClose: true,
      container: document.body,
    });
    M.Timepicker.init(timeElems, {
      twelveHour: false,
      autoClose: true,
      container: "body",
    });
  }, [reminderType, consecutiveBase]);

  return (
    <div
      className="container valign-wrapper center-align"
      style={{ height: "100%" }}
    >
      <main className="row">
        <h3 className="col s12">Reminder</h3>
        <div className="col s12">
          <div className="row list-reminder">
            {reminders.length === 0 ? (
              <p>No reminders yet</p>
            ) : (
              reminders.map((reminder, index) => (
                <div key={index} className="col s12">
                  <div className="s8">{reminder}</div>
                  <div className="s4 offset-s4">
                    <i className="material-icons">details</i>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      <footer>
        <a
          data-tooltip="Add Reminder"
          data-position="top"
          className="btn-floating btn-large waves-effect waves-light red tooltipped modal-trigger"
          href="#setting-modal"
        >
          <i className="material-icons">add</i>
        </a>
      </footer>
      <div id="setting-modal" className="modal">
        <div className="modal-content">
          <h4 className="color-dark mb-40">Set Reminder</h4>
          <div className="input-field col s12">
            <select
              id="reminder_type"
              value={reminderType}
              onChange={(e) => setReminderType(e.target.value)}
            >
              <option value="" disabled>
                Choose Type
              </option>
              <option value="consecutive">Consecutive</option>
              <option value="date">Date Based</option>
            </select>
            <label htmlFor="reminder_type">Type</label>
          </div>
          {reminderType === "consecutive" && (
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
                    <input id="start_time" type="text" className="timepicker" />
                    <label htmlFor="start_time">Start Time</label>
                  </div>
                  <div className="input-field col s12">
                    <input id="consecutive_time" type="number" />
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
                    <input id="start_date" type="text" className="datepicker" />
                    <label htmlFor="start_date">Start Date</label>
                  </div>
                  <div className="input-field col s12">
                    <input id="start_time" type="text" className="timepicker" />
                    <label htmlFor="start_time">Start Time</label>
                  </div>
                </>
              )}
            </div>
          )}
          {reminderType === "date" && (
            <>
              <div className="input-field col s12">
                <input id="date_reminder" type="text" className="datepicker" />
                <label htmlFor="date_reminder">Date</label>
              </div>
              <div className="input-field col s12">
                <input id="time_reminder" type="text" className="timepicker" />
                <label htmlFor="time_reminder">Time</label>
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <a className="modal-close waves-effect waves-green btn-flat">Close</a>
        </div>
      </div>
    </div>
  );
}

export default App;
