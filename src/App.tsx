import { useState, useEffect } from "react";
import "./App.css";
import M from "materialize-css";

function App() {
  const [reminders, setReminders] = useState([]);
  useEffect(() => {
    const elems = document.querySelectorAll(".tooltipped");
    M.Tooltip.init(elems);
  }, []);

  return (
    <div
      className="container valign-wrapper center-align"
      style={{ height: "100%" }}
    >
      <div className="row">
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
        <div className="col s2 offset-s10">
          <a
            data-tooltip="Add Reminder"
            className="btn-floating btn-large waves-effect waves-light red tooltipped"
          >
            <i className="material-icons">add</i>
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
