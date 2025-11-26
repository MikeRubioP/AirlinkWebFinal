import { useState, useMemo } from "react";
import QRCode from "qrcode";

export default function QrButton({
  payload,
  label = "Ver QR",
  className = "px-4 py-2 rounded-xl border border-[#E7E7ED] bg-white hover:bg-[#fafafe]"
}) {
  const [open, setOpen] = useState(false);
  const [dataUrl, setDataUrl] = useState("");

  const text = useMemo(() => {
    // compactamos el objeto y lo convertimos a string
    const clean = Object.fromEntries(
      Object.entries(payload || {}).filter(([, v]) => v !== undefined && v !== null && v !== "")
    );
    return JSON.stringify(clean);
  }, [payload]);

  async function handleOpen() {
    try {
      const url = await QRCode.toDataURL(text, { margin: 2, width: 320 });
      setDataUrl(url);
      setOpen(true);
    } catch (e) {
      console.error("QR error:", e);
    }
  }

  function download() {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "boarding-qr.png";
    a.click();
  }

  return (
    <>
      <button onClick={handleOpen} className={className}>
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] bg-black/40 grid place-items-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm text-center shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Código QR</h3>
            <p className="text-xs text-gray-500 mb-3 break-all">{text}</p>
            {dataUrl ? (
              <img
                src={dataUrl}
                alt="QR"
                className="mx-auto w-[280px] h-[280px] object-contain rounded-lg border"
              />
            ) : (
              <div className="h-[280px] grid place-items-center text-gray-500">Generando…</div>
            )}

            <div className="mt-4 flex gap-2 justify-center">
              <button
                onClick={download}
                className="px-4 py-2 rounded-xl border border-[#E7E7ED] bg-white hover:bg-[#fafafe]"
              >
                Descargar
              </button>
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-xl text-white bg-[#7C4DFF] hover:opacity-90"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
