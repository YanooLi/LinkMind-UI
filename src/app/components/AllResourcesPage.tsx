import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Button } from './Button';
import { PageHeader } from './PageHeader';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PageType } from '../routes';
import { analyticsPath, formatDate, toRows, useResources, type ResourceRow } from '../lib';
import { copyText } from '../useAnalysis';
import { deleteResource } from '@/store/resourcesSlice';
import { useAppDispatch } from '@/store';

type ResourceType = 'all' | 'link' | 'qr';
type SortOption = 'date' | 'clicks' | 'name';

interface AllResourcesPageProps {
  onNavigate?: (page: PageType) => void;
}

export function AllResourcesPage({ onNavigate }: AllResourcesPageProps) {
  const [activeFilter, setActiveFilter] = useState<ResourceType>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { urls, qrs, loaded, error } = useResources();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const resources = toRows(urls, qrs).map((r) => ({
    id: `${r.kind}:${r.id}`, row: r, title: r.title, originalUrl: r.originalUrl,
    type: (r.kind === 'url' ? 'link' : 'qr') as 'link' | 'qr', shortCode: r.display, clicks: r.count,
    created: formatDate(r.createdAt),
    aiCategory: r.category ?? (r.aiEnabled ? 'Pending' : 'AI off'),
    aiRisk: (!r.isSafe ? 'high' : r.score != null && r.score < 0.8 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
    aiAnalyzed: r.analyzed,
  }));

  const filteredResources = resources
    .filter((resource) => {
      const matchesFilter = activeFilter === 'all' || resource.type === activeFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch = q === '' || resource.title.toLowerCase().includes(q) || resource.originalUrl.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) =>
      sortBy === 'clicks' ? b.clicks - a.clicks
        : sortBy === 'name' ? a.title.localeCompare(b.title)
        : b.row.createdAt.localeCompare(a.row.createdAt));

  const copy = async (id: string, text: string) => {
    if (await copyText(text)) { setCopiedId(id); setTimeout(() => setCopiedId(null), 1500); }
  };
  const remove = (r: ResourceRow) => {
    setOpenMenuId(null);
    if (window.confirm(`Delete "${r.title}"? The ${r.kind === 'url' ? 'short link' : 'QR code'} will stop working.`)) {
      dispatch(deleteResource({ type: r.kind, id: r.id }));
    }
  };

  const getTypeIcon = (type: 'link' | 'qr') => {
    switch (type) {
      case 'link':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M6.5 8.5a4 4 0 0 0 6 0l2.5-2.5a4 4 0 0 0-5.66-5.66L8 1.67"
              stroke="#2E4BC8"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M9.5 7.5a4 4 0 0 0-6 0L1 10a4 4 0 0 0 5.66 5.66L8 14.33"
              stroke="#2E4BC8"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        );
      case 'qr':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="6" height="6" stroke="#2E4BC8" strokeWidth="1.5" />
            <rect x="9" y="1" width="6" height="6" stroke="#2E4BC8" strokeWidth="1.5" />
            <rect x="1" y="9" width="6" height="6" stroke="#2E4BC8" strokeWidth="1.5" />
            <rect x="3" y="3" width="2" height="2" fill="#2E4BC8" />
            <rect x="11" y="3" width="2" height="2" fill="#2E4BC8" />
            <rect x="3" y="11" width="2" height="2" fill="#2E4BC8" />
          </svg>
        );
    }
  };

  const getTypeBadge = (type: 'link' | 'qr') => {
    const styles = {
      link: 'bg-[#E8EBFF] text-[#2E4BC8]',
      qr: 'bg-[#FFF4E6] text-[#F59E0B]',
    };

    const labels = {
      link: 'Link',
      qr: 'QR Code',
    };

    return (
      <span
        className={`px-3 py-1 rounded-full font-['Inter',sans-serif] text-[12px] font-semibold whitespace-nowrap ${styles[type]}`}
      >
        {labels[type]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex flex-col">
      <Header onNavigate={onNavigate} />
      <div className="flex flex-1">
        <Sidebar activeItem="all-resources" onNavigate={onNavigate} />
        <main className="flex-1 p-4 md:p-8 min-w-0 overflow-auto">
          <div className="max-w-[1400px] mx-auto">
            <PageHeader
              title="All Resources"
              subtitle="Manage all your shortened links, QR codes, and barcodes in one place."
            />

            {/* Action Bar */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex-1 flex items-center gap-3">
                {/* Search Bar */}
                <div className="flex-1 max-w-[400px] flex items-center gap-3 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg px-4 py-3">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="9" cy="9" r="6" stroke="#717182" strokeWidth="2" />
                    <path d="M14 14l4 4" stroke="#717182" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by title or URL..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent outline-none font-['Inter',sans-serif] text-[14px] text-[#444653]"
                  />
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2">
                  {[
                    { id: 'all' as ResourceType, label: 'All' },
                    { id: 'link' as ResourceType, label: 'Links' },
                    { id: 'qr' as ResourceType, label: 'QR Codes' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilter(filter.id)}
                      className={`px-4 py-2 rounded-lg font-['Inter',sans-serif] font-medium text-[14px] transition-all whitespace-nowrap ${
                        activeFilter === filter.id
                          ? 'bg-[#2E4BC8] text-white'
                          : 'bg-white text-[#717182] border border-[rgba(0,0,0,0.1)] hover:bg-[#F8F9FC]'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-4 py-2 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg font-['Inter',sans-serif] text-[14px] text-[#444653] outline-none cursor-pointer"
                >
                  <option value="date">Sort by Date</option>
                  <option value="clicks">Sort by Clicks</option>
                  <option value="name">Sort by Name</option>
                </select>
              </div>

              <Button variant="primary" onClick={() => onNavigate && onNavigate('create-link')}>Create Link</Button>
            </div>

            {/* Resources Table with Horizontal Scroll */}
            <div className="bg-white rounded-lg border border-[rgba(0,0,0,0.1)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px]">
                  <thead>
                    <tr className="bg-[#F8F9FC] border-b border-[rgba(0,0,0,0.1)]">
                      <th className="px-6 py-4 text-left font-['Inter',sans-serif] font-semibold text-[12px] text-[#717182] uppercase tracking-wide whitespace-nowrap">
                        Title
                      </th>
                      <th className="px-6 py-4 text-left font-['Inter',sans-serif] font-semibold text-[12px] text-[#717182] uppercase tracking-wide whitespace-nowrap">
                        Original URL
                      </th>
                      <th className="px-6 py-4 text-left font-['Inter',sans-serif] font-semibold text-[12px] text-[#717182] uppercase tracking-wide whitespace-nowrap">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left font-['Inter',sans-serif] font-semibold text-[12px] text-[#717182] uppercase tracking-wide whitespace-nowrap">
                        Short Code
                      </th>
                      <th className="px-6 py-4 text-left font-['Inter',sans-serif] font-semibold text-[12px] text-[#717182] uppercase tracking-wide whitespace-nowrap">
                        Clicks/Scans
                      </th>
                      <th className="px-6 py-4 text-left font-['Inter',sans-serif] font-semibold text-[12px] text-[#717182] uppercase tracking-wide whitespace-nowrap">
                        Created
                      </th>
                      <th className="px-6 py-4 text-left font-['Inter',sans-serif] font-semibold text-[12px] text-[#717182] uppercase tracking-wide whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          AI Category
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path
                              d="M7 1L8.5 4.5L12.5 5L9.5 8L10.5 12L7 10L3.5 12L4.5 8L1.5 5L5.5 4.5L7 1Z"
                              stroke="#717182"
                              strokeWidth="1.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left font-['Inter',sans-serif] font-semibold text-[12px] text-[#717182] uppercase tracking-wide whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          Risk
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path
                              d="M7 1L8.5 4.5L12.5 5L9.5 8L10.5 12L7 10L3.5 12L4.5 8L1.5 5L5.5 4.5L7 1Z"
                              stroke="#717182"
                              strokeWidth="1.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-right font-['Inter',sans-serif] font-semibold text-[12px] text-[#717182] uppercase tracking-wide whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResources.map((resource) => (
                      <tr
                        key={resource.id}
                        className="border-b border-[rgba(0,0,0,0.05)] hover:bg-[#F8F9FC] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 min-w-[180px]">
                            <div className="w-8 h-8 bg-[#E8EBFF] rounded-lg flex items-center justify-center flex-shrink-0">
                              {getTypeIcon(resource.type)}
                            </div>
                            <span className="font-['Inter',sans-serif] font-medium text-[14px] text-[#1a1b22] whitespace-nowrap">
                              {resource.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-[250px]">
                            <span
                              className="font-['Inter',sans-serif] text-[13px] text-[#717182] block truncate"
                              title={resource.originalUrl}
                            >
                              {resource.originalUrl}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">{getTypeBadge(resource.type)}</td>
                        <td className="px-6 py-4">
                          <span className="font-['Inter',sans-serif] font-medium text-[14px] text-[#2E4BC8] whitespace-nowrap">
                            {resource.shortCode}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-['Inter',sans-serif] font-semibold text-[14px] text-[#1a1b22] whitespace-nowrap">
                            {resource.clicks.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-['Inter',sans-serif] text-[14px] text-[#717182] whitespace-nowrap">
                            {resource.created}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {resource.aiAnalyzed ? (
                            <span className="font-['Inter',sans-serif] text-[13px] text-[#444653] whitespace-nowrap">
                              {resource.aiCategory}
                            </span>
                          ) : (
                            <span className="font-['Inter',sans-serif] text-[12px] text-[#ABABBA] italic whitespace-nowrap">
                              Not analyzed
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {resource.aiAnalyzed ? (
                            <span
                              className={`px-2 py-1 rounded-full font-['Inter',sans-serif] text-[11px] font-semibold capitalize whitespace-nowrap inline-block ${
                                resource.aiRisk === 'low'
                                  ? 'bg-[#E8F5E9] text-[#2E7D32]'
                                  : resource.aiRisk === 'medium'
                                  ? 'bg-[#FFF4E6] text-[#E65100]'
                                  : 'bg-[#FFEBEE] text-[#C62828]'
                              }`}
                            >
                              {resource.aiRisk}
                            </span>
                          ) : (
                            <span className="font-['Inter',sans-serif] text-[12px] text-[#ABABBA] whitespace-nowrap">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              className="p-2 hover:bg-[#E8EBFF] rounded-lg transition-colors group"
                              title={copiedId === resource.id ? 'Copied!' : 'Copy link'}
                              onClick={() => copy(resource.id, resource.row.link)}
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <rect
                                  x="5"
                                  y="5"
                                  width="9"
                                  height="9"
                                  rx="1"
                                  stroke="#717182"
                                  strokeWidth="1.5"
                                  className="group-hover:stroke-[#2E4BC8]"
                                />
                                <path
                                  d="M3 11V3a1 1 0 0 1 1-1h8"
                                  stroke="#717182"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  className="group-hover:stroke-[#2E4BC8]"
                                />
                              </svg>
                            </button>
                            <button
                              className="p-2 hover:bg-[#E8EBFF] rounded-lg transition-colors group"
                              title="View Analytics"
                              onClick={() => navigate(analyticsPath(resource.row.kind, resource.row.id))}
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path
                                  d="M2 13V7M8 13V3M14 13v-4"
                                  stroke="#717182"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  className="group-hover:stroke-[#2E4BC8]"
                                />
                              </svg>
                            </button>
                            <div className="relative">
                              <button
                                onClick={() => setOpenMenuId(openMenuId === resource.id ? null : resource.id)}
                                className="p-2 hover:bg-[#E8EBFF] rounded-lg transition-colors group"
                                title="More actions"
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                  <circle cx="8" cy="3" r="1.5" fill="#717182" className="group-hover:fill-[#2E4BC8]" />
                                  <circle cx="8" cy="8" r="1.5" fill="#717182" className="group-hover:fill-[#2E4BC8]" />
                                  <circle cx="8" cy="13" r="1.5" fill="#717182" className="group-hover:fill-[#2E4BC8]" />
                                </svg>
                              </button>
                              
                              {openMenuId === resource.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setOpenMenuId(null)}
                                  />
                                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-[rgba(0,0,0,0.1)] shadow-lg z-20 py-1">
                                    <a
                                      href={resource.originalUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-full px-4 py-2 text-left font-['Inter',sans-serif] text-[14px] text-[#444653] hover:bg-[#F8F9FC] transition-colors flex items-center gap-2"
                                      onClick={() => setOpenMenuId(null)}
                                    >
                                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path
                                          d="M12 4L14 4L14 6M14 4L8 10M6 2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2"
                                          stroke="currentColor"
                                          strokeWidth="1.5"
                                          strokeLinecap="round"
                                        />
                                      </svg>
                                      Open Destination
                                    </a>
                                    {(resource.type === 'qr' && resource.row.imageUrl) && (
                                      <a
                                        href={`${resource.row.imageUrl}?size=16`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full px-4 py-2 text-left font-['Inter',sans-serif] text-[14px] text-[#444653] hover:bg-[#F8F9FC] transition-colors flex items-center gap-2"
                                        onClick={() => setOpenMenuId(null)}
                                      >
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                          <path
                                            d="M14 10v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2M8 11V2M5 8l3 3 3-3"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                        Download PNG
                                      </a>
                                    )}
                                    <div className="border-t border-[rgba(0,0,0,0.05)] my-1" />
                                    <button
                                      className="w-full px-4 py-2 text-left font-['Inter',sans-serif] text-[14px] text-[#DC2626] hover:bg-[#FFEBEE] transition-colors flex items-center gap-2"
                                      onClick={() => remove(resource.row)}
                                    >
                                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path
                                          d="M2 4h12M6.5 7v5M9.5 7v5M3 4l1 9a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-9M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"
                                          stroke="currentColor"
                                          strokeWidth="1.5"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                      Delete
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {error && <p className="mt-4 font-['Inter',sans-serif] text-[14px] text-[#BA1A1A]">{error}</p>}

            {/* Empty State (if no results) */}
            {loaded && filteredResources.length === 0 && (
              <div className="bg-white rounded-lg border border-[rgba(0,0,0,0.1)] p-12 text-center mt-6">
                <div className="w-16 h-16 bg-[#E8EBFF] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path
                      d="M16 8v8m0 4h.01M28 16c0 6.627-5.373 12-12 12S4 22.627 4 16 9.373 4 16 4s12 5.373 12 12z"
                      stroke="#2E4BC8"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <h3 className="font-['Manrope',sans-serif] font-bold text-[20px] text-[#1a1b22] mb-2">
                  {resources.length === 0 ? 'No resources yet' : 'No resources found'}
                </h3>
                <p className="font-['Inter',sans-serif] text-[14px] text-[#717182] mb-6">
                  {resources.length === 0
                    ? 'Create a short link or a QR code and it will appear here.'
                    : "Try adjusting your search or filter to find what you're looking for."}
                </p>
                {resources.length === 0 ? (
                  <Button variant="secondary" onClick={() => onNavigate && onNavigate('create-link')}>Create Short Link</Button>
                ) : (
                  <Button variant="secondary" onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                  }}>Clear Filters</Button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}