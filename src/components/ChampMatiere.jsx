export default function ChampMatiere({ value, onChange, style, required }) {
  return (
    <input
      type="text"
      placeholder="Ex: Calcul, Français..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={style}
      required={required}
      autoComplete="off"
    />
  );
}
