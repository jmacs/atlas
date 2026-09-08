type ServerStatusProps = {
  status: string;
};

export function ServerStatus({status}: ServerStatusProps) {
  return (
    <p id="server-status" aria-live="polite">
      Server status: {status}
    </p>
  );
}
