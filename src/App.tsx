/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { PlanProvider } from './context/PlanContext';
import { FavoritesRecentProvider } from './context/FavoritesRecentContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { UpgradeModal } from './components/common/UpgradeModal';
import { CookieConsent } from './components/common/CookieConsent';
import { SearchModal } from './components/common/SearchModal';
import { HomePage } from './pages/HomePage';
import { CategoryPage } from './pages/CategoryPage';
import { PricingPage } from './pages/PricingPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { AffiliatesPage } from './pages/AffiliatesPage';
import { StaticPage } from './pages/StaticPages';
import { HistoryPage } from './pages/HistoryPage';
import { ToolLayout } from './components/layout/ToolLayout';
import { TOOLS_CONFIG } from './config/tools.config';
import { Loader2 } from 'lucide-react';

// ==========================================
// 34 Lazy-Loaded Tools (Code-Splitting)
// ==========================================

// 1. PDF Organization
const PdfMergeTool = lazy(() => import('./tools/pdf-merge/PdfMergeTool').then((m) => ({ default: m.PdfMergeTool })));
const PdfSplitTool = lazy(() => import('./tools/pdf-split/PdfSplitTool').then((m) => ({ default: m.PdfSplitTool })));
const PdfCompressTool = lazy(() => import('./tools/pdf-compress/PdfCompressTool').then((m) => ({ default: m.PdfCompressTool })));
const PdfSizeRemoverTool = lazy(() => import('./tools/pdf-size-remover/PdfSizeRemoverTool').then((m) => ({ default: m.PdfSizeRemoverTool })));
const PdfSizeGainerTool = lazy(() => import('./tools/pdf-size-gainer/PdfSizeGainerTool').then((m) => ({ default: m.PdfSizeGainerTool })));
const PdfRotateTool = lazy(() => import('./tools/pdf-rotate/PdfRotateTool').then((m) => ({ default: m.PdfRotateTool })));
const PdfDeletePagesTool = lazy(() => import('./tools/pdf-delete-pages/PdfDeletePagesTool').then((m) => ({ default: m.PdfDeletePagesTool })));
const PdfExtractPagesTool = lazy(() => import('./tools/pdf-extract-pages/PdfExtractPagesTool').then((m) => ({ default: m.PdfExtractPagesTool })));
const PdfReorderPagesTool = lazy(() => import('./tools/pdf-reorder-pages/PdfReorderPagesTool').then((m) => ({ default: m.PdfReorderPagesTool })));

// 2. PDF Editing
const PdfWatermarkTool = lazy(() => import('./tools/pdf-watermark/PdfWatermarkTool').then((m) => ({ default: m.PdfWatermarkTool })));
const PdfPageNumbersTool = lazy(() => import('./tools/pdf-page-numbers/PdfPageNumbersTool').then((m) => ({ default: m.PdfPageNumbersTool })));
const PdfCropTool = lazy(() => import('./tools/pdf-crop/PdfCropTool').then((m) => ({ default: m.PdfCropTool })));
const PdfGrayscaleTool = lazy(() => import('./tools/pdf-grayscale/PdfGrayscaleTool').then((m) => ({ default: m.PdfGrayscaleTool })));
const PdfRedactTool = lazy(() => import('./tools/pdf-redact/PdfRedactTool').then((m) => ({ default: m.PdfRedactTool })));
const PdfAnnotateTool = lazy(() => import('./tools/pdf-annotate/PdfAnnotateTool').then((m) => ({ default: m.PdfAnnotateTool })));

// 3. PDF Extraction
const PdfTextExtractorTool = lazy(() => import('./tools/pdf-text-extractor/PdfTextExtractorTool').then((m) => ({ default: m.PdfTextExtractorTool })));
const PdfImageExtractorTool = lazy(() => import('./tools/pdf-image-extractor/PdfImageExtractorTool').then((m) => ({ default: m.PdfImageExtractorTool })));
const PdfSearchTool = lazy(() => import('./tools/pdf-search/PdfSearchTool').then((m) => ({ default: m.PdfSearchTool })));
const PdfMetadataTool = lazy(() => import('./tools/pdf-metadata/PdfMetadataTool').then((m) => ({ default: m.PdfMetadataTool })));
const PdfThumbnailTool = lazy(() => import('./tools/pdf-thumbnail/PdfThumbnailTool').then((m) => ({ default: m.PdfThumbnailTool })));
const PdfContactSheetTool = lazy(() => import('./tools/pdf-contact-sheet/PdfContactSheetTool').then((m) => ({ default: m.PdfContactSheetTool })));

// 4. PDF Forms & Signing
const PdfFillSignTool = lazy(() => import('./tools/pdf-fill-sign/PdfFillSignTool').then((m) => ({ default: m.PdfFillSignTool })));
const PdfFormFillerTool = lazy(() => import('./tools/pdf-form-filler/PdfFormFillerTool').then((m) => ({ default: m.PdfFormFillerTool })));
const SignatureMakerTool = lazy(() => import('./tools/signature-maker/SignatureMakerTool').then((m) => ({ default: m.SignatureMakerTool })));

// 5. PDF Conversion
const ImageToPdfTool = lazy(() => import('./tools/image-to-pdf/ImageToPdfTool').then((m) => ({ default: m.ImageToPdfTool })));
const PdfToImageTool = lazy(() => import('./tools/pdf-to-image/PdfToImageTool').then((m) => ({ default: m.PdfToImageTool })));
const PdfPageSizeTool = lazy(() => import('./tools/pdf-page-size/PdfPageSizeTool').then((m) => ({ default: m.PdfPageSizeTool })));

// 6. Image Utilities
const ImageCompressorTool = lazy(() => import('./tools/image-compressor/ImageCompressorTool').then((m) => ({ default: m.ImageCompressorTool })));
const ImageConverterTool = lazy(() => import('./tools/image-converter/ImageConverterTool').then((m) => ({ default: m.ImageConverterTool })));
const ImageResizerTool = lazy(() => import('./tools/image-resizer/ImageResizerTool').then((m) => ({ default: m.ImageResizerTool })));
const HeicToJpgTool = lazy(() => import('./tools/heic-to-jpg/HeicToJpgTool').then((m) => ({ default: m.HeicToJpgTool })));

// 7. Document Utilities
const DocumentScannerTool = lazy(() => import('./tools/document-scanner/DocumentScannerTool').then((m) => ({ default: m.DocumentScannerTool })));
const WordCounterTool = lazy(() => import('./tools/word-counter/WordCounterTool').then((m) => ({ default: m.WordCounterTool })));
const TextCleanerTool = lazy(() => import('./tools/text-cleaner/TextCleanerTool').then((m) => ({ default: m.TextCleanerTool })));

// 8. Format Converters & Security (16 New Tools)
const PdfToWordTool = lazy(() => import('./tools/pdf-to-word/PdfToWordTool').then((m) => ({ default: m.PdfToWordTool })));
const WordToPdfTool = lazy(() => import('./tools/word-to-pdf/WordToPdfTool').then((m) => ({ default: m.WordToPdfTool })));
const PdfToExcelTool = lazy(() => import('./tools/pdf-to-excel/PdfToExcelTool').then((m) => ({ default: m.PdfToExcelTool })));
const ExcelToPdfTool = lazy(() => import('./tools/excel-to-pdf/ExcelToPdfTool').then((m) => ({ default: m.ExcelToPdfTool })));
const PdfToPowerpointTool = lazy(() => import('./tools/pdf-to-powerpoint/PdfToPowerpointTool').then((m) => ({ default: m.PdfToPowerpointTool })));
const MarkdownToPdfTool = lazy(() => import('./tools/markdown-to-pdf/MarkdownToPdfTool').then((m) => ({ default: m.MarkdownToPdfTool })));
const HtmlToPdfTool = lazy(() => import('./tools/html-to-pdf/HtmlToPdfTool').then((m) => ({ default: m.HtmlToPdfTool })));
const PdfToHtmlTool = lazy(() => import('./tools/pdf-to-html/PdfToHtmlTool').then((m) => ({ default: m.PdfToHtmlTool })));
const CsvToPdfTool = lazy(() => import('./tools/csv-to-pdf/CsvToPdfTool').then((m) => ({ default: m.CsvToPdfTool })));
const JsonToPdfTool = lazy(() => import('./tools/json-to-pdf/JsonToPdfTool').then((m) => ({ default: m.JsonToPdfTool })));
const PdfToTextTool = lazy(() => import('./tools/pdf-to-text/PdfToTextTool').then((m) => ({ default: m.PdfToTextTool })));
const PdfProtectTool = lazy(() => import('./tools/pdf-protect/PdfProtectTool').then((m) => ({ default: m.PdfProtectTool })));
const PdfUnlockTool = lazy(() => import('./tools/pdf-unlock/PdfUnlockTool').then((m) => ({ default: m.PdfUnlockTool })));
const PdfDarkModeTool = lazy(() => import('./tools/pdf-dark-mode/PdfDarkModeTool').then((m) => ({ default: m.PdfDarkModeTool })));
const OcrImageToTextTool = lazy(() => import('./tools/ocr-image-to-text/OcrImageToTextTool').then((m) => ({ default: m.OcrImageToTextTool })));
const PdfToBase64Tool = lazy(() => import('./tools/pdf-to-base64/PdfToBase64Tool').then((m) => ({ default: m.PdfToBase64Tool })));

const TOOL_COMPONENTS: Record<string, React.ComponentType> = {
  // 1. PDF Organization
  'pdf-merge': PdfMergeTool,
  'pdf-split': PdfSplitTool,
  'pdf-compress': PdfCompressTool,
  'pdf-size-remover': PdfSizeRemoverTool,
  'pdf-size-gainer': PdfSizeGainerTool,
  'pdf-rotate': PdfRotateTool,
  'pdf-delete-pages': PdfDeletePagesTool,
  'pdf-extract-pages': PdfExtractPagesTool,
  'pdf-reorder-pages': PdfReorderPagesTool,

  // 2. PDF Editing
  'pdf-watermark': PdfWatermarkTool,
  'pdf-page-numbers': PdfPageNumbersTool,
  'pdf-crop': PdfCropTool,
  'pdf-grayscale': PdfGrayscaleTool,
  'pdf-redact': PdfRedactTool,
  'pdf-annotate': PdfAnnotateTool,
  'pdf-dark-mode': PdfDarkModeTool,

  // 3. PDF Extraction
  'pdf-text-extractor': PdfTextExtractorTool,
  'pdf-image-extractor': PdfImageExtractorTool,
  'pdf-search': PdfSearchTool,
  'pdf-metadata': PdfMetadataTool,
  'pdf-thumbnail': PdfThumbnailTool,
  'pdf-contact-sheet': PdfContactSheetTool,
  'pdf-to-text': PdfToTextTool,

  // 4. PDF Forms & Signing
  'pdf-fill-sign': PdfFillSignTool,
  'pdf-form-filler': PdfFormFillerTool,
  'signature-maker': SignatureMakerTool,

  // 5. PDF Conversion & Format Converters
  'image-to-pdf': ImageToPdfTool,
  'pdf-to-image': PdfToImageTool,
  'pdf-page-size': PdfPageSizeTool,
  'pdf-to-word': PdfToWordTool,
  'word-to-pdf': WordToPdfTool,
  'pdf-to-excel': PdfToExcelTool,
  'excel-to-pdf': ExcelToPdfTool,
  'pdf-to-powerpoint': PdfToPowerpointTool,
  'markdown-to-pdf': MarkdownToPdfTool,
  'html-to-pdf': HtmlToPdfTool,
  'pdf-to-html': PdfToHtmlTool,
  'csv-to-pdf': CsvToPdfTool,
  'json-to-pdf': JsonToPdfTool,

  // 6. Security & Privacy
  'pdf-protect': PdfProtectTool,
  'pdf-unlock': PdfUnlockTool,

  // 7. Image & Document Utilities
  'image-compressor': ImageCompressorTool,
  'image-converter': ImageConverterTool,
  'image-resizer': ImageResizerTool,
  'heic-to-jpg': HeicToJpgTool,
  'document-scanner': DocumentScannerTool,
  'ocr-image-to-text': OcrImageToTextTool,
  'pdf-to-base64': PdfToBase64Tool,
  'word-counter': WordCounterTool,
  'text-cleaner': TextCleanerTool,
};

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [searchModalOpen, setSearchModalOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (route: string) => {
    if (route === currentRoute) return;
    window.history.pushState({}, '', route);
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route Dispatcher
  const renderCurrentRoute = () => {
    // 1. Static Pages
    if (currentRoute === '/pricing') return <PricingPage onNavigate={navigate} />;
    if (currentRoute === '/marketplace') return <MarketplacePage onNavigate={navigate} />;
    if (currentRoute === '/affiliates') return <AffiliatesPage onNavigate={navigate} />;
    if (currentRoute === '/history') return <HistoryPage onNavigate={navigate} />;
    if (currentRoute === '/privacy') return <StaticPage type="privacy" onNavigate={navigate} />;
    if (currentRoute === '/terms') return <StaticPage type="terms" onNavigate={navigate} />;
    if (currentRoute === '/about') return <StaticPage type="about" onNavigate={navigate} />;
    if (currentRoute === '/contact') return <StaticPage type="contact" onNavigate={navigate} />;
    if (currentRoute === '/disclaimer') return <StaticPage type="disclaimer" onNavigate={navigate} />;

    // 2. Category Page (/pdf-documents)
    if (currentRoute === '/pdf-documents' || currentRoute.startsWith('/category/')) {
      return <CategoryPage onNavigate={navigate} />;
    }

    // 3. Tool Pages (/pdf-merge, /pdf-split, /image-compressor, etc.)
    const cleanSlug = currentRoute.replace(/^\//, '');
    const matchedTool = TOOLS_CONFIG.find((t) => t.slug === cleanSlug);

    if (matchedTool) {
      const ToolComponent = TOOL_COMPONENTS[matchedTool.slug];

      return (
        <ToolLayout tool={matchedTool} onNavigate={navigate}>
          <Suspense
            fallback={
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-xs font-medium">Loading {matchedTool.shortTitle || matchedTool.title}...</p>
              </div>
            }
          >
            {ToolComponent ? <ToolComponent /> : <div className="text-xs text-slate-400">Tool component coming soon.</div>}
          </Suspense>
        </ToolLayout>
      );
    }

    // 4. Default: Home Page
    return <HomePage onNavigate={navigate} onOpenSearch={() => setSearchModalOpen(true)} />;
  };

  return (
    <PlanProvider>
      <FavoritesRecentProvider>
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
          <Header
            currentRoute={currentRoute}
            onNavigate={navigate}
            onOpenSearch={() => setSearchModalOpen(true)}
          />

          <main className="flex-1 w-full">
            {renderCurrentRoute()}
          </main>

          <Footer onNavigate={navigate} />

          {/* Modals & Banners */}
          <UpgradeModal />
          <CookieConsent />
          <SearchModal
            isOpen={searchModalOpen}
            onClose={() => setSearchModalOpen(false)}
            onSelectTool={(slug) => navigate(`/${slug}`)}
          />
        </div>
      </FavoritesRecentProvider>
    </PlanProvider>
  );
}
