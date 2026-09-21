export default function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}<input {...props} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-normal outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10" /></label>
}
