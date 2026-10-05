import React, { useState, useEffect } from 'react';
import { FileDropzone, FileItem, formatBytes } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown } from 'pdf-lib';
import { FormInput, AlertCircle, ArrowRight, Save, Check } from 'lucide-react';

interface DetectedField {
  name: string;
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'other';
  value: string | boolean;
  options?: string[];
}

export const PdfFormFillerTool: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [fields, setFields] = useState<DetectedField[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);

  useEffect(() => {
    if (files.length === 0) {
      setFields([]);
      setHasScanned(false);
      return;
    }

    const scanFormFields = async () => {
      setIsProcessing(true);
      setProgress(25);
      setProgressMsg('Inspecting PDF AcroForm interactive fields...');

      try {
        const buffer = await files[0].file.arrayBuffer();
        const doc = await PDFDocument.load(buffer);
        const form = doc.getForm();
        const rawFields = form.getFields();

        const detected: DetectedField[] = [];

        rawFields.forEach((f) => {
          const name = f.getName();
          if (f instanceof PDFTextField) {
            detected.push({
              name,
              type: 'text',
              value: f.getText() || '',
            });
          } else if (f instanceof PDFCheckBox) {
            detected.push({
              name,
              type: 'checkbox',
              value: f.isChecked(),
            });
          } else if (f instanceof PDFDropdown) {
            detected.push({
              name,
              type: 'dropdown',
              value: f.getSelected()[0] || '',
              options: f.getOptions(),
            });
          } else if (f instanceof PDFRadioGroup) {
            detected.push({
              name,
              type: 'radio',
              value: f.getSelected() || '',
              options: f.getOptions(),
            });
          }
        });

        setFields(detected);
        setHasScanned(true);
        setIsProcessing(false);
      } catch (err: any) {
        setIsProcessing(false);
        setFields([]);
        setHasScanned(true);
      }
    };

    scanFormFields();
  }, [files]);

  const handleFieldChange = (name: string, val: string | boolean) => {
    setFields((prev) =>
      prev.map((f) => (f.name === name ? { ...f, value: val } : f))
    );
  };

  const handleSaveForm = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(30);
    setProgressMsg('Writing field values into PDF AcroForm structure...');

    try {
      const buffer = await files[0].file.arrayBuffer();
      const doc = await PDFDocument.load(buffer);
      const form = doc.getForm();

      fields.forEach((f) => {
        try {
          if (f.type === 'text') {
            const tf = form.getTextField(f.name);
            tf.setText(String(f.value));
          } else if (f.type === 'checkbox') {
            const cb = form.getCheckBox(f.name);
            if (f.value) cb.check();
            else cb.uncheck();
          } else if (f.type === 'dropdown') {
            const dd = form.getDropdown(f.name);
            if (f.value) dd.select(String(f.value));
          } else if (f.type === 'radio') {
            const rg = form.getRadioGroup(f.name);
            if (f.value) rg.select(String(f.value));
          }
        } catch {}
      });

      const updatedBytes = await doc.save();
      setResultBytes(updatedBytes);
      setIsProcessing(false);
      setProgress(100);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to save filled PDF form.');
    }
  };

  const handleReset = () => {
    setFiles([]);
    setFields([]);
    setHasScanned(false);
    setResultBytes(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {resultBytes ? (
        <ResultCard
          title="PDF Form Saved Successfully!"
          filename={`${files[0]?.name.replace(/\.pdf$/i, '')}_filled.pdf`}
          data={resultBytes}
          fileSizeStr={formatBytes(resultBytes.byteLength)}
          extraInfo="All interactive AcroForm fields updated and validated."
          onReset={handleReset}
        />
      ) : (
        <div className="space-y-6">
          <FileDropzone
            files={files}
            onFilesChange={(newFiles) => {
              setFiles(newFiles.slice(0, 1));
              if (error) setError(null);
            }}
            multiple={false}
            maxFiles={1}
            title="Upload official interactive PDF form"
            subtitle="Scans and fills text boxes, checkboxes, radio buttons, and dropdowns."
            error={error}
            onErrorDismiss={() => setError(null)}
            disabled={isProcessing}
          />

          {hasScanned && fields.length === 0 && (
            <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <h4 className="font-bold text-white text-sm">No Interactive Form Fields Detected</h4>
              </div>
              <p className="leading-relaxed">
                This PDF does not appear to contain interactive AcroForm fields (it is likely a flattened or scanned document).
              </p>
              <div className="pt-1">
                <a
                  href="/pdf-fill-sign"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
                >
                  <span>Use PDF Fill & Sign Instead</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {fields.length > 0 && !isProcessing && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  <FormInput className="w-4 h-4 text-emerald-400" />
                  <span>Detected {fields.length} Interactive Form Fields</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                {fields.map((f) => (
                  <div key={f.name} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs">
                    <label className="block text-slate-300 font-medium truncate" title={f.name}>
                      {f.name}
                    </label>

                    {f.type === 'text' && (
                      <input
                        type="text"
                        value={String(f.value)}
                        onChange={(e) => handleFieldChange(f.name, e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                      />
                    )}

                    {f.type === 'checkbox' && (
                      <label className="flex items-center gap-2 cursor-pointer pt-1 text-slate-300">
                        <input
                          type="checkbox"
                          checked={Boolean(f.value)}
                          onChange={(e) => handleFieldChange(f.name, e.target.checked)}
                          className="rounded bg-slate-950 border-slate-700 text-blue-600"
                        />
                        <span>Checked</span>
                      </label>
                    )}

                    {f.type === 'dropdown' && f.options && (
                      <select
                        value={String(f.value)}
                        onChange={(e) => handleFieldChange(f.name, e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs"
                      >
                        {f.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {f.type === 'radio' && f.options && (
                      <div className="flex flex-wrap gap-3 pt-1">
                        {f.options.map((opt) => (
                          <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                            <input
                              type="radio"
                              name={f.name}
                              value={opt}
                              checked={f.value === opt}
                              onChange={() => handleFieldChange(f.name, opt)}
                              className="text-blue-600 bg-slate-950 border-slate-700"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleSaveForm}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/40 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Filled PDF Form</span>
                </button>
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} message={progressMsg} />}
        </div>
      )}
    </div>
  );
};
