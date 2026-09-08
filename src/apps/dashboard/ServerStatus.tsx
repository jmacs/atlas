type ServerStatusProps = {
  status: string;
};

export function ServerStatus({status}: ServerStatusProps) {
  return (
    <p id="server-status" class="type-body-small text-muted" aria-live="polite">
      Status: {status}
    </p>
  );
}
