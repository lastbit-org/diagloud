type ConnectionFeedbackProps = {
  message: string | null;
};

export function ConnectionFeedback({ message }: ConnectionFeedbackProps) {
  if (!message) return null;

  return (
    <div
      className="connection-feedback connection-feedback--visible"
      role="alert"
      aria-live="assertive"
    >
      <span className="connection-feedback__icon" aria-hidden>
        !
      </span>
      <span className="connection-feedback__text">{message}</span>
    </div>
  );
}
