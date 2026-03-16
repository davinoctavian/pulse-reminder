interface Props {
  reminderType: string;
  setReminderType: (val: string) => void;
}

function ReminderTypeSelect({ reminderType, setReminderType }: Props) {
  return (
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
  );
}

export default ReminderTypeSelect;
