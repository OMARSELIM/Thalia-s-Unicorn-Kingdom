import { useMemo, useState } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Crown,
  Download,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { MemoryCategory, MemoryPhoto } from '../game/types';

interface MemoryAlbumModalProps {
  playerName: string;
  memories: MemoryPhoto[];
  onClose: () => void;
  onDeleteMemory: (id: string) => void;
}

type AlbumFilter = 'all' | MemoryCategory;

function formatArabicDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

export function MemoryAlbumModal({
  playerName,
  memories,
  onClose,
  onDeleteMemory,
}: MemoryAlbumModalProps) {
  const [filter, setFilter] = useState<AlbumFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === 'all') return memories;
    return memories.filter((m) => m.category === filter);
  }, [memories, filter]);

  const bossCount = useMemo(
    () => memories.filter((m) => m.category === 'boss').length,
    [memories]
  );
  const heroCount = useMemo(
    () => memories.filter((m) => m.category === 'hero').length,
    [memories]
  );

  const selectedIndex = selectedId ? filtered.findIndex((m) => m.id === selectedId) : -1;
  const selectedPhoto = selectedIndex >= 0 ? filtered[selectedIndex] : null;

  const handleDownload = (photo: MemoryPhoto) => {
    const link = document.createElement('a');
    link.href = photo.imageDataUrl;
    link.download = `talia-memory-${photo.id.replace(/[^a-z0-9_-]/gi, '-')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E1233]/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="memory-album-title"
    >
      <div className="animate-modal-pop flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-[#F3D5E3] bg-[#FFFDF9] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F5E1EC] px-6 py-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <Camera className="h-6 w-6 text-[#E11D74]" />
            <h2 id="memory-album-title" className="font-display text-2xl font-bold text-[#3D1D42]">
              ألبوم الذكريات
            </h2>
            <span className="text-sm font-medium text-[#7B4F70]">·</span>
            <span className="text-sm font-bold text-[#9D174D]">
              مغامرات {playerName} ({memories.length} لقطة)
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق ألبوم الذكريات"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#F3D5E3] bg-white text-[#5A2450] transition-colors hover:bg-[#FFF0F6] focus-visible:outline-2 focus-visible:outline-[#E11D74]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Bar */}
        {!selectedPhoto && memories.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F7E8F0] bg-[#FFF8FB] px-6 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`rounded-xl px-3.5 py-2 font-display text-xs font-bold transition-colors sm:text-sm ${
                  filter === 'all'
                    ? 'bg-[#E11D74] text-white shadow-sm'
                    : 'border border-[#EAC5D8] bg-white text-[#5A2450] hover:bg-[#FFF0F6]'
                }`}
              >
                الكل ({memories.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('boss')}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 font-display text-xs font-bold transition-colors sm:text-sm ${
                  filter === 'boss'
                    ? 'bg-[#D97706] text-white shadow-sm'
                    : 'border border-[#EAC5D8] bg-white text-[#5A2450] hover:bg-[#FFFBEB]'
                }`}
              >
                <Crown className="h-4 w-4" />
                <span>انتصارات الزعماء ({bossCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilter('hero')}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 font-display text-xs font-bold transition-colors sm:text-sm ${
                  filter === 'hero'
                    ? 'bg-[#0D9488] text-white shadow-sm'
                    : 'border border-[#EAC5D8] bg-white text-[#5A2450] hover:bg-[#F0FDFA]'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>اكتشاف الأبطال ({heroCount})</span>
              </button>
            </div>
            <p className="text-xs font-medium text-[#75486A]">
              اضغطي على أي لقطة لعرضها بالحجم الكامل
            </p>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedPhoto ? (
            <div className="flex flex-col gap-4">
              {/* Lightbox Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#EAC5D8] bg-white px-3.5 py-2 font-display text-sm font-bold text-[#5A2450] hover:bg-[#FFF0F6]"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span>العودة إلى الألبوم</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownload(selectedPhoto)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0D9488] px-3.5 py-2 font-display text-sm font-bold text-white shadow-sm hover:bg-[#0F766E]"
                  >
                    <Download className="h-4 w-4" />
                    <span>حفظ الصورة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextCandidate =
                        filtered[selectedIndex + 1]?.id || filtered[selectedIndex - 1]?.id || null;
                      onDeleteMemory(selectedPhoto.id);
                      setSelectedId(nextCandidate);
                    }}
                    aria-label="حذف اللقطة"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#FECDD3] bg-[#FFF1F2] px-3.5 py-2 font-display text-sm font-bold text-[#BE123C] hover:bg-[#FFE4E6]"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>

              {/* Full-size Photo Frame */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-[#F3D5E3] bg-[#1E1233] shadow-md">
                <img
                  src={selectedPhoto.imageDataUrl}
                  alt={selectedPhoto.title}
                  className="aspect-video w-full object-contain"
                />
                {filtered.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const prevIdx = (selectedIndex - 1 + filtered.length) % filtered.length;
                        setSelectedId(filtered[prevIdx].id);
                      }}
                      aria-label="اللقطة السابقة"
                      className="absolute top-1/2 right-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-[#FFFDF9]/90 text-[#3D1D42] shadow-md hover:bg-white"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextIdx = (selectedIndex + 1) % filtered.length;
                        setSelectedId(filtered[nextIdx].id);
                      }}
                      aria-label="اللقطة التالية"
                      className="absolute top-1/2 left-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-[#FFFDF9]/90 text-[#3D1D42] shadow-md hover:bg-white"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Story Caption */}
              <div className="rounded-2xl border border-[#F3D5E3] bg-[#FFF8FB] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {selectedPhoto.category === 'boss' ? (
                      <Crown className="h-5 w-5 text-[#D97706]" />
                    ) : (
                      <Sparkles className="h-5 w-5 text-[#0D9488]" />
                    )}
                    <h3 className="font-display text-lg font-extrabold text-[#3D1D42]">
                      {selectedPhoto.title}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-[#75486A]">
                    {formatArabicDate(selectedPhoto.capturedAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-[#5A2450]">{selectedPhoto.subtitle}</p>
                {(selectedPhoto.score !== undefined || selectedPhoto.distance !== undefined) && (
                  <p className="mt-2 tabular-nums text-xs font-bold text-[#9D174D]">
                    {selectedPhoto.realmName}
                    {selectedPhoto.distance !== undefined ? ` · المسافة ${selectedPhoto.distance} م` : ''}
                    {selectedPhoto.score !== undefined
                      ? ` · النتيجة ${selectedPhoto.score.toLocaleString('en-US')}`
                      : ''}
                  </p>
                )}
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#EAC5D8] bg-[#FFF8FB] px-6 py-14 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FCE7F3] text-[#E11D74]">
                <Camera className="h-7 w-7" />
              </div>
              <h3 className="font-display text-xl font-bold text-[#3D1D42]">
                {memories.length === 0
                  ? 'ألبوم الذكريات بانتظار أول مغامرة!'
                  : 'لا توجد لقطات في هذا التصنيف بعد'}
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[#6B3A5E]">
                تُحفظ لقطات شاشة أوتوماتيكياً هنا كلما هزمتِ زعيماً جديداً في أي عالم أو اكتشفتِ
                بطلاً ومرافقاً جديداً من خزانة التخصيص.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filtered.map((photo) => (
                <div
                  key={photo.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-[#F3D5E3] bg-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:border-[#E11D74]/50 hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(photo.id)}
                    className="relative aspect-video w-full overflow-hidden bg-[#1E1233] text-right focus-visible:outline-2 focus-visible:outline-[#E11D74]"
                  >
                    <img
                      src={photo.imageDataUrl}
                      alt={photo.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#1A0D2E]/70 to-transparent" />
                    <span className="absolute bottom-2.5 right-3 inline-flex items-center gap-1 text-xs font-bold text-white drop-shadow">
                      {photo.category === 'boss' ? (
                        <Crown className="h-3.5 w-3.5 text-[#FDE047]" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 text-[#5EEAD4]" />
                      )}
                      <span>{photo.category === 'boss' ? 'انتصار على زعيم' : 'اكتشاف بطل'}</span>
                    </span>
                  </button>

                  <div className="flex flex-1 flex-col justify-between p-3.5">
                    <div>
                      <h3 className="font-display text-base font-bold text-[#3D1D42]">
                        {photo.title}
                      </h3>
                      <p className="mt-0.5 text-xs font-medium text-[#6B3A5E]">{photo.subtitle}</p>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between border-t border-[#F7E8F0] pt-2 text-[11px] font-bold text-[#75486A]">
                      <span>{photo.realmName}</span>
                      <span className="tabular-nums">{formatArabicDate(photo.capturedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
