function AddReminderButton() {
  return (
    <a
      data-tooltip="Add Reminder"
      data-position="top"
      className="btn-floating btn-large waves-effect waves-light red tooltipped modal-trigger"
      href="#setting-modal"
    >
      <i className="material-icons">add_alarm</i>
    </a>
  );
}

export default AddReminderButton;
