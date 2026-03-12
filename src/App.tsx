import { useState, useEffect } from "react";
import "./App.css";
import M from "materialize-css";

function App() {
  const [reminders, setReminders] = useState([]);
  const [reminderType, setReminderType] = useState("");
  useEffect(() => {
    const elems = document.querySelectorAll(".tooltipped");
    const modalElems = document.querySelectorAll(".modal");
    const selectElems = document.querySelectorAll("select");
    const dateElems = document.querySelectorAll(".datepicker");
    const timeElems = document.querySelectorAll(".timepicker");
    M.Datepicker.init(dateElems, {
      format: "yyyy-mm-dd",
      autoClose: true,
    });
    M.Timepicker.init(timeElems, {
      twelveHour: false,
      autoClose: true,
    });
    M.FormSelect.init(selectElems);
    M.Tooltip.init(elems);
    M.Modal.init(modalElems);
  }, []);

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
          <h4>Modal Header</h4>
          <div className="input-field col s12">
            <select
              value={reminderType}
              onChange={(e) => setReminderType(e.target.value)}
            >
              <option value="" disabled selected>
                Choose Type
              </option>
              <option value="consecutive">Consecutive</option>
              <option value="date">Date Based</option>
            </select>
            <label>Type</label>
          </div>
          {reminderType === "consecutive" && (
            <div>
              <div className="input-field col s12">
                <input
                  id="consecutive_count"
                  type="number"
                  className="validate"
                />
                <label htmlFor="consecutive_count">Consecutive Count</label>
              </div>
              <div className="input-field col s12">
                <input
                  id="consecutive_time"
                  type="number"
                  className="validate"
                />
                <label htmlFor="consecutive_time">
                  Consecutive Time (minutes)
                </label>
              </div>
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
          <a className="modal-close waves-effect waves-green btn-flat">Agree</a>
        </div>
      </div>
    </div>
  );
}

export default App;
