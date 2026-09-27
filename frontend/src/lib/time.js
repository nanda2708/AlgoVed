export const formatDuration = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${days ? `${days}d ` : ''}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export const formatDateTime = (value) => new Date(value).toLocaleString(undefined, {
  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
});
