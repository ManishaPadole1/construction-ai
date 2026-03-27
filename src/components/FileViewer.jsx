import { useEffect, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import { X } from "lucide-react";

export default function FileViewer({ fileUrl, fileType, urn, token, onClose }) {
  const viewerRef = useRef(null);
  const [txtContent, setTxtContent] = useState("");

  // -------- TXT --------
  useEffect(() => {
    if (fileType === "txt") {
      fetch(fileUrl)
        .then((res) => res.text())
        .then((text) => setTxtContent(text));
    }
  }, [fileUrl, fileType]);

  // -------- DWG (Forge Viewer) --------
  useEffect(() => {
    if (fileType !== "dwg" || !urn || !token) return;

    const options = { env: "AutodeskProduction", accessToken: token };

    Autodesk.Viewing.Initializer(options, () => {
      const viewer = new Autodesk.Viewing.GuiViewer3D(viewerRef.current);
      viewer.start();

      Autodesk.Viewing.Document.load(
        `urn:${urn}`,
        (doc) => {
          const viewable = doc.getRoot().getDefaultGeometry();
          viewer.loadDocumentNode(doc, viewable);
        },
        (err) => console.error("Forge Viewer Error:", err)
      );
    });
  }, [fileType, urn, token]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-xl shadow-xl overflow-hidden relative">

        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-white shadow p-2 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5 text-slate-700" />
        </button>

        {/* DWG */}
        {fileType === "dwg" && (
          <div ref={viewerRef} className="w-full h-full" />
        )}

        {/* PDF */}
        {fileType === "pdf" && (
          <div className="w-full h-full overflow-auto p-6">
            <Document file={fileUrl}>
              <Page pageNumber={1} />
            </Document>
          </div>
        )}

        {/* TXT */}
        {fileType === "txt" && (
          <div className="w-full h-full overflow-auto p-6">
            <pre className="whitespace-pre-wrap text-sm">{txtContent}</pre>
          </div>
        )}

        {/* Fallback */}
        {!["dwg", "pdf", "txt"].includes(fileType) && (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-700">No preview available</p>
          </div>
        )}
      </div>
    </div>
  );
}
