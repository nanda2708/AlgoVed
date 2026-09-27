export function AuthCard({ title, children, footer }) {
  return (
    <div className="mx-auto mt-14 w-full max-w-sm px-4 sm:mt-20">
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      <div className="mt-6">{children}</div>
      {footer && <p className="mt-6 text-sm text-slate-400">{footer}</p>}
    </div>
  );
}

export function Field({ label, hint, ...props }) {
  return (
    <label className="block">
      <span className="text-sm text-slate-300">{label}</span>
      <input {...props} className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}
