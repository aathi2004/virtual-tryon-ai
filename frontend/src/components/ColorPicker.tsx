interface Props {
  onChange: (c: string) => void;
}

export default function ColorPicker({ onChange }: Props) {
  const colors = ["#ffffff", "#ff0000", "#1e90ff", "#16a34a", "#000000"];

  return (
    <div className="flex gap-3 mt-4">
      {colors.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className="w-8 h-8 rounded border"
          style={{ background: c }}
        />
      ))}
    </div>
  );
}