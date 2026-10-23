import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Check,
  X,
  Edit3,
  ExternalLink,
  BookOpen,
  Hash,
  Clock,
  Save,
  AlertCircle,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { StagingRecord, StagingStatus, StagingStreamType } from '../../types';
import { adminService } from '../../services/careerServices';

export const AdminStagingReviewPage: React.FC = () => {
  const [records, setRecords] = useState<StagingRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<StagingRecord | null>(null);
  const [editedPayload, setEditedPayload] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [streamFilter, setStreamFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadRecords();
  }, [statusFilter, streamFilter]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const sFilter = statusFilter === 'ALL' ? undefined : (statusFilter as StagingStatus);
      const stFilter = streamFilter === 'ALL' ? undefined : (streamFilter as StagingStreamType);
      const data = await adminService.listStaging(sFilter, stFilter);
      setRecords(data);
      if (data.length > 0 && !selectedRecord) {
        setSelectedRecord(data[0]);
        setEditedPayload(data[0].extracted_payload);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRecord = (rec: StagingRecord) => {
    setSelectedRecord(rec);
    setEditedPayload(rec.extracted_payload);
    setReviewNotes(rec.review_notes || '');
    setActionSuccess(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedRecord) return;
    try {
      const updated = await adminService.updateStagingPayload(selectedRecord.id, editedPayload);
      setSelectedRecord(updated);
      setActionSuccess('Đã lưu các thay đổi vào bản ghi Staging!');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu chỉnh sửa.');
    }
  };

  const handleReviewDecision = async (decision: StagingStatus) => {
    if (!selectedRecord) return;
    try {
      const updated = await adminService.reviewStaging(selectedRecord.id, decision, reviewNotes);
      setSelectedRecord(updated);
      setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
      setActionSuccess(
        decision === 'APPROVED'
          ? 'Đã PHÊ DUYỆT thành công! Lộ trình đã xuất bản vào major_roadmaps và nạp vector pgvector.'
          : 'Đã TỪ CHỐI bản ghi staging.'
      );
    } catch (err: any) {
      alert(err.message || 'Lỗi trong quá trình kiểm duyệt.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900/70 rounded-3xl p-6 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">
              Giao Diện Kiểm Duyệt Bán Tự Động (Human-in-the-Loop Review UI)
            </h1>
            <p className="text-xs text-slate-400">
              Kiểm tra tính xác thực nguồn gốc và chỉnh sửa trước khi xuất bản vào Knowledge Base (Bảng 6 & DF05)
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-700 text-xs bg-slate-950/60 text-slate-200 font-semibold focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ duyệt (PENDING)</option>
            <option value="APPROVED">Đã duyệt (APPROVED)</option>
            <option value="REJECTED">Từ chối (REJECTED)</option>
          </select>

          <select
            value={streamFilter}
            onChange={(e) => setStreamFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-700 text-xs bg-slate-950/60 text-slate-200 font-semibold focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">Tất cả luồng</option>
            <option value="STREAM_A_MOET">Stream A (Bộ GD&ĐT)</option>
            <option value="STREAM_B_ROADMAP">Stream B (Lộ trình Web)</option>
          </select>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Split-Pane UI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Records List & Provenance Metadata (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
            Hàng đợi Chờ Kiểm duyệt ({records.length})
          </h2>

          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
            {records.map(rec => {
              const isSelected = selectedRecord?.id === rec.id;
              return (
                <div
                  key={rec.id}
                  onClick={() => handleSelectRecord(rec)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500 shadow-md ring-1 ring-purple-500/50'
                      : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      rec.stream_type === 'STREAM_A_MOET'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}>
                      {rec.stream_type === 'STREAM_A_MOET' ? 'STREAM A (MOET)' : 'STREAM B (ROADMAP)'}
                    </span>

                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      rec.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : rec.status === 'REJECTED'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {rec.status}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white line-clamp-1">
                    {rec.major_code ? `[${rec.major_code}] ` : ''}{rec.source_title}
                  </h3>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span className="truncate max-w-[200px]">{rec.source_url}</span>
                    <span>{new Date(rec.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Provenance Box of Selected Record */}
          {selectedRecord && (
            <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 text-xs space-y-2.5">
              <h4 className="font-extrabold text-white flex items-center space-x-1.5 text-xs">
                <Hash className="w-4 h-4 text-purple-400" />
                <span>Truy Xuất Nguồn Gốc (Provenance Audit)</span>
              </h4>
              <div className="space-y-1.5 text-[11px] text-slate-300 font-mono">
                <p><strong>SHA-256 Hash:</strong> <span className="text-[10px] text-purple-300 break-all">{selectedRecord.content_hash}</span></p>
                <p><strong>Nguồn:</strong> {selectedRecord.source_title}</p>
                <p><strong>Vị trí trích dẫn:</strong> {selectedRecord.source_page || 'Toàn văn'}</p>
                <p><strong>URL gốc:</strong> <a href={selectedRecord.source_url} target="_blank" rel="noreferrer" className="text-indigo-400 underline truncate block">{selectedRecord.source_url}</a></p>
              </div>
            </div>
          )}
        </div>

        {/* Right Pane: Interactive Form / JSON Editor (7 cols) */}
        {selectedRecord && editedPayload ? (
          <div className="lg:col-span-7 bg-slate-900/80 rounded-3xl p-6 border border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
                  Bản ghi Staging: {selectedRecord.id.slice(0, 8)}...
                </span>
                <h3 className="text-base font-extrabold text-white mt-1">
                  Biểu Mẫu Chỉnh Sửa Dữ Liệu Trước Khi Duyệt
                </h3>
              </div>

              <button
                type="button"
                onClick={handleSaveEdit}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors border border-slate-700"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Nháp Sửa Đổi</span>
              </button>
            </div>

            {/* Editable Fields */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Mã ngành cấp IV</label>
                  <input
                    type="text"
                    value={editedPayload.major_code || selectedRecord.major_code || ''}
                    onChange={(e) => setEditedPayload({ ...editedPayload, major_code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-700 font-mono font-bold text-purple-300 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Tên ngành đào tạo</label>
                  <input
                    type="text"
                    value={editedPayload.major_title || editedPayload.major_name || ''}
                    onChange={(e) => setEditedPayload({ ...editedPayload, major_title: e.target.value, major_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-700 font-bold text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Milestones Preview or Edit */}
              {editedPayload.milestones && (
                <div className="space-y-2">
                  <label className="block font-bold text-slate-300">Các mốc lộ trình ({editedPayload.milestones.length} mốc):</label>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {editedPayload.milestones.map((m: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-white">Mốc {m.step}: {m.title}</span>
                          <span className="text-[10px] text-slate-400 font-bold">{m.duration_weeks} tuần</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{m.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Notes */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">Ghi chú kiểm duyệt của Admin:</label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Ghi chú xác thực đối chiếu với Thông tư 09 hoặc đề cương trường..."
                  className="w-full p-3 rounded-xl bg-slate-950/60 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Approval Decision Action Buttons */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => handleReviewDecision('REJECTED')}
                className="px-5 py-2.5 rounded-xl border border-rose-500/40 text-rose-300 hover:bg-rose-950/30 font-bold text-xs transition-colors flex items-center space-x-1.5"
              >
                <X className="w-4 h-4" />
                <span>Từ chối (Reject)</span>
              </button>

              <button
                type="button"
                onClick={() => handleReviewDecision('APPROVED')}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-900/30 transition-all flex items-center space-x-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Phê Duyệt & Xuất Bản vào Cache & pgvector</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 bg-slate-900/80 rounded-3xl p-12 border border-slate-800 text-center text-slate-400 space-y-2">
            <p className="text-sm font-bold text-slate-300">Chọn một bản ghi ở cột bên trái để kiểm duyệt.</p>
          </div>
        )}
      </div>
    </div>
  );
};
