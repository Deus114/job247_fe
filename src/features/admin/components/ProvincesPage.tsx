import { useTranslation } from 'react-i18next';
import { useState, useMemo, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  addProvince,
  updateProvince,
  softDeleteProvince,
  restoreProvince,
  permanentDeleteProvince,
  toggleProvinceActive,
} from '@/store/slices/catalogSlice';
import type { Province } from '@/types/catalog';
import SortHeader from '@/components/ui/SortHeader';
import ColumnVisibilityDropdown from '@/components/ui/ColumnVisibilityDropdown';
import Pagination from '@/components/ui/Pagination';
import CustomSelect from '@/components/ui/CustomSelect';

type SortField = 'name' | 'code' | 'region' | 'createdAt';

export default function ProvincesPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const allProvinces = useAppSelector((state) => state.catalog.provinces);
  const deletedProvinces = useAppSelector((state) => state.catalog.deletedProvinces);
  const allJobs = useAppSelector((state) => state.jobs.items);

  const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Province | null>(null);
  const [detail, setDetail] = useState<Province | null>(null);
  const [confirmSoftDelete, setConfirmSoftDelete] = useState<string | null>(null);
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', code: '', region: '' });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [visibleColumns, setVisibleColumns] = useState([
    'name',
    'code',
    'region',
    'count',
    'active',
    'createdAt',
    'actions',
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const regionOptions = [
    { value: '', label: t('adminUi.provinces.allRegions') },
    { value: 'north', label: t('adminUi.provinces.regions.north') },
    { value: 'central', label: t('adminUi.provinces.regions.central') },
    { value: 'south', label: t('adminUi.provinces.regions.south') },
  ];

  const formRegionOptions = regionOptions.filter((o) => o.value);

  const regionLabel = (region?: string) => {
    if (!region) return t('adminUi.common.notAvailable');
    const key = `adminUi.provinces.regions.${region}`;
    const translated = t(key);
    return translated === key ? region : translated;
  };

  const handleSort = (field: string) => {
    if (sortField === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field as SortField);
      setSortOrder('asc');
    }
  };

  const visible = viewMode === 'active' ? allProvinces : deletedProvinces;

  const filtered = useMemo(() => {
    let list = visible.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(q) ||
        (p.code || '').toLowerCase().includes(q);
      const matchRegion = !regionFilter || p.region === regionFilter;
      const matchFrom = !dateFrom || (p.createdAt || '') >= dateFrom;
      const matchTo = !dateTo || (p.createdAt || '') <= dateTo;
      return matchSearch && matchRegion && matchFrom && matchTo;
    });
    list = [...list].sort((a, b) => {
      const aVal =
        sortField === 'name'
          ? a.name
          : sortField === 'code'
            ? a.code || ''
            : sortField === 'region'
              ? a.region || ''
              : a.createdAt || '';
      const bVal =
        sortField === 'name'
          ? b.name
          : sortField === 'code'
            ? b.code || ''
            : sortField === 'region'
              ? b.region || ''
              : b.createdAt || '';
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return list;
  }, [visible, search, regionFilter, dateFrom, dateTo, sortField, sortOrder]);

  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    setCurrentPage(1);
  }, [search, regionFilter, dateFrom, dateTo, viewMode, pageSize]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', code: '', region: '' });
    setModalOpen(true);
  };

  const openEdit = (item: Province) => {
    setEditing(item);
    setForm({
      name: item.name,
      code: item.code || '',
      region: item.region || '',
    });
    setModalOpen(true);
    setDropdownOpen(null);
  };

  const handleSave = () => {
    const name = form.name.trim();
    if (!name) return;
    if (editing) {
      dispatch(
        updateProvince({
          id: editing.id,
          name,
          code: form.code,
          region: form.region,
        }),
      );
    } else {
      if (
        allProvinces.some((p) => p.name === name) ||
        deletedProvinces.some((p) => p.name === name)
      )
        return;
      dispatch(addProvince({ name, code: form.code, region: form.region }));
    }
    setModalOpen(false);
  };

  const nameExists =
    !editing &&
    (allProvinces.some((p) => p.name === form.name.trim()) ||
      deletedProvinces.some((p) => p.name === form.name.trim()));

  const canSave =
    Boolean(form.name.trim()) &&
    !nameExists &&
    !(
      editing &&
      form.name.trim() === editing.name &&
      form.code === (editing.code || '') &&
      form.region === (editing.region || '')
    );

  const jobCount = (name: string) =>
    allJobs.filter((j) => !j.deletedAt && j.location.includes(name)).length;

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground-950">
              {t('adminUi.pageTitles.provinces')}
            </h2>
            <p className="text-sm text-foreground-500 mt-1">
              {viewMode === 'active'
                ? `${filtered.length} / ${allProvinces.length} ${t('adminUi.provinces.items')}`
                : `${filtered.length} / ${deletedProvinces.length} ${t('adminUi.jobs.deleted')}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ColumnVisibilityDropdown
              columns={[
                { key: 'name', label: t('adminUi.columns.name') },
                { key: 'code', label: t('adminUi.columns.code') },
                { key: 'region', label: t('adminUi.columns.region') },
                { key: 'count', label: t('adminUi.columns.jobPosts') },
                { key: 'active', label: t('adminUi.columns.active') },
                { key: 'createdAt', label: t('adminUi.columns.createdAt') },
                { key: 'actions', label: t('adminUi.columns.actions') },
              ]}
              visibleKeys={visibleColumns}
              onChange={setVisibleColumns}
            />
            {viewMode === 'active' && (
              <button
                type="button"
                onClick={openAdd}
                className="inline-flex items-center justify-center gap-1.5 h-10 px-3 text-sm font-medium rounded-xl border border-primary-500 bg-primary-500 text-white hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-add-line"></i> {t('adminUi.provinces.add')}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setViewMode('active');
                setSearch('');
              }}
              className={`inline-flex items-center justify-center gap-1.5 h-10 px-3 text-sm font-medium rounded-xl border transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'active'
                  ? 'border-primary-200 bg-primary-100 text-primary-700'
                  : 'border-background-200/70 bg-background-50 text-foreground-600 hover:bg-background-100'
              }`}
            >
              <i className="ri-map-pin-line"></i>
              {t('adminUi.actions.active')}
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('trash');
                setSearch('');
              }}
              className={`inline-flex items-center justify-center gap-1.5 h-10 px-3 text-sm font-medium rounded-xl border transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'trash'
                  ? 'border-red-200 bg-red-100 text-red-600'
                  : 'border-background-200/70 bg-background-50 text-foreground-600 hover:bg-background-100'
              }`}
            >
              <i className="ri-delete-bin-line"></i>
              {t('adminUi.actions.trash')}
              {deletedProvinces.length > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px]">
                  {deletedProvinces.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap">
          <div className="relative flex-1 w-full sm:max-w-[220px]">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm pointer-events-none"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('adminUi.provinces.searchPlaceholder')}
              className="w-full h-10 pl-9 pr-4 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300"
            />
          </div>
          <div className="w-full sm:w-[200px]">
            <CustomSelect
              value={regionFilter}
              options={regionOptions}
              onChange={setRegionFilter}
              placeholder={t('adminUi.provinces.allRegions')}
              outlined
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-10 px-3 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300"
            />
            <span className="text-xs text-foreground-400">{t('adminUi.jobs.to')}</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-10 px-3 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300"
            />
          </div>
          {(search || regionFilter || dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setRegionFilter('');
                setDateFrom('');
                setDateTo('');
              }}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-3 text-sm rounded-xl border border-background-200/70 bg-background-50 text-foreground-600 hover:bg-background-100 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-filter-off-line"></i>
              {t('adminUi.actions.clearFilters')}
            </button>
          )}
        </div>
      </div>

      {viewMode === 'trash' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-700">
            <i className="ri-information-line mr-1"></i>
            {t('adminUi.provinces.trashInfo')}
          </p>
        </div>
      )}

      <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-background-200/70">
                {visibleColumns.includes('name') && (
                  <SortHeader
                    label={t('adminUi.columns.name').toUpperCase()}
                    field="name"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                )}
                {visibleColumns.includes('code') && (
                  <SortHeader
                    label={t('adminUi.columns.code').toUpperCase()}
                    field="code"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                )}
                {visibleColumns.includes('region') && (
                  <SortHeader
                    label={t('adminUi.columns.region').toUpperCase()}
                    field="region"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                )}
                {visibleColumns.includes('count') && (
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                    {t('adminUi.columns.jobPosts').toUpperCase()}
                  </th>
                )}
                {visibleColumns.includes('createdAt') && (
                  <SortHeader
                    label={t('adminUi.columns.createdAt').toUpperCase()}
                    field="createdAt"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                )}
                {visibleColumns.includes('active') && (
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                    {t('adminUi.columns.active').toUpperCase()}
                  </th>
                )}
                {viewMode === 'trash' && (
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                    {t('adminUi.columns.deletedAt').toUpperCase()}
                  </th>
                )}
                {visibleColumns.includes('actions') && (
                  <th className="text-right px-5 py-3 text-xs font-semibold text-foreground-500 w-[80px]">
                    {t('adminUi.columns.actions').toUpperCase()}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginated.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-background-100 hover:bg-background-50 transition-colors"
                >
                  {visibleColumns.includes('name') && (
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0">
                          <i className="ri-map-pin-line text-accent-600"></i>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDetail(item)}
                          className="font-medium text-foreground-900 hover:text-primary-500 cursor-pointer text-left"
                        >
                          {item.name}
                        </button>
                      </div>
                    </td>
                  )}
                  {visibleColumns.includes('code') && (
                    <td className="px-5 py-3 whitespace-nowrap">
                      <code className="text-xs font-mono bg-background-100 px-2 py-0.5 rounded">
                        {item.code || '—'}
                      </code>
                    </td>
                  )}
                  {visibleColumns.includes('region') && (
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-secondary-100 text-secondary-700 rounded-full text-xs font-medium">
                        {regionLabel(item.region)}
                      </span>
                    </td>
                  )}
                  {visibleColumns.includes('count') && (
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-accent-100 text-accent-700 rounded-full text-xs font-medium">
                        {t('adminUi.provinces.postsCount', { count: jobCount(item.name) })}
                      </span>
                    </td>
                  )}
                  {visibleColumns.includes('createdAt') && (
                    <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">
                      {item.createdAt || '—'}
                    </td>
                  )}
                  {visibleColumns.includes('active') && (
                    <td className="px-5 py-3 whitespace-nowrap">
                      {viewMode === 'active' ? (
                        <button
                          type="button"
                          onClick={() => dispatch(toggleProvinceActive(item.id))}
                          className={`px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer ${
                            item.isActive !== false
                              ? 'bg-accent-100 text-accent-600 hover:bg-accent-200'
                              : 'bg-red-100 text-red-600 hover:bg-red-200'
                          }`}
                        >
                          {item.isActive !== false ? t('adminUi.jobs.on') : t('adminUi.jobs.off')}
                        </button>
                      ) : (
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                            item.isActive !== false
                              ? 'bg-accent-100 text-accent-600'
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {item.isActive !== false ? t('adminUi.jobs.on') : t('adminUi.jobs.off')}
                        </span>
                      )}
                    </td>
                  )}
                  {viewMode === 'trash' && (
                    <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">
                      {item.deletedAt
                        ? new Date(item.deletedAt).toLocaleDateString('vi-VN')
                        : '—'}
                    </td>
                  )}
                  {visibleColumns.includes('actions') && (
                    <td className="px-5 py-3 text-right whitespace-nowrap relative">
                      {confirmSoftDelete === item.id && viewMode === 'active' ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              dispatch(softDeleteProvince(item.id));
                              setConfirmSoftDelete(null);
                            }}
                            className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-xs font-medium cursor-pointer"
                          >
                            {t('adminUi.jobs.confirmDelete')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmSoftDelete(null)}
                            className="px-2.5 py-1 border border-background-300 rounded-lg text-xs cursor-pointer"
                          >
                            {t('adminUi.actions.cancel')}
                          </button>
                        </div>
                      ) : confirmPermanentDelete === item.id && viewMode === 'trash' ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              dispatch(permanentDeleteProvince(item.id));
                              setConfirmPermanentDelete(null);
                            }}
                            className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-medium cursor-pointer"
                          >
                            {t('adminUi.jobs.deletePermanent')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmPermanentDelete(null)}
                            className="px-2.5 py-1 border border-background-300 rounded-lg text-xs cursor-pointer"
                          >
                            {t('adminUi.actions.cancel')}
                          </button>
                        </div>
                      ) : (
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() =>
                              setDropdownOpen(dropdownOpen === item.id ? null : item.id)
                            }
                            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-background-100 cursor-pointer"
                          >
                            <i className="ri-more-2-fill text-foreground-500"></i>
                          </button>
                          {dropdownOpen === item.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-background-50 border border-background-200/70 rounded-xl shadow-lg z-20 overflow-hidden">
                              {viewMode === 'active' ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDetail(item);
                                      setDropdownOpen(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-background-100 cursor-pointer"
                                  >
                                    <i className="ri-eye-line text-primary-500"></i>
                                    {t('adminUi.jobs.viewDetails')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openEdit(item)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-background-100 cursor-pointer"
                                  >
                                    <i className="ri-edit-line text-accent-500"></i>
                                    {t('adminUi.jobs.edit')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirmSoftDelete(item.id);
                                      setDropdownOpen(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 cursor-pointer"
                                  >
                                    <i className="ri-delete-bin-line"></i>
                                    {t('adminUi.jobs.confirmDelete')}
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      dispatch(restoreProvince(item.id));
                                      setDropdownOpen(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent-600 hover:bg-accent-50 cursor-pointer"
                                  >
                                    <i className="ri-arrow-go-back-line"></i>
                                    {t('adminUi.jobs.restore')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirmPermanentDelete(item.id);
                                      setDropdownOpen(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 cursor-pointer"
                                  >
                                    <i className="ri-delete-bin-6-line"></i>
                                    {t('adminUi.jobs.deletePermanent')}
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-4">
              <i className="ri-map-pin-line text-2xl text-foreground-400"></i>
            </div>
            <p className="text-sm text-foreground-500">
              {viewMode === 'active'
                ? search || regionFilter
                  ? t('adminUi.provinces.noFiltered')
                  : t('adminUi.provinces.noFound')
                : t('adminUi.jobs.trashEmpty')}
            </p>
          </div>
        )}
        {filtered.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filtered.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetail(null)}></div>
          <div className="relative bg-background-50 border border-background-200 rounded-2xl p-6 w-full max-w-lg shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0">
                  <i className="ri-map-pin-line text-accent-600"></i>
                </div>
                <h3 className="text-lg font-heading font-semibold text-foreground-950 truncate">
                  {detail.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-background-100 cursor-pointer"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-background-100 rounded-xl">
                <p className="text-xs text-foreground-500">{t('adminUi.columns.code')}</p>
                <p className="text-sm font-medium text-foreground-900 mt-1">
                  {detail.code || '—'}
                </p>
              </div>
              <div className="p-3 bg-background-100 rounded-xl">
                <p className="text-xs text-foreground-500">{t('adminUi.columns.region')}</p>
                <p className="text-sm font-medium text-foreground-900 mt-1">
                  {regionLabel(detail.region)}
                </p>
              </div>
              <div className="p-3 bg-background-100 rounded-xl">
                <p className="text-xs text-foreground-500">{t('adminUi.columns.jobPosts')}</p>
                <p className="text-xl font-bold text-foreground-900">{jobCount(detail.name)}</p>
              </div>
              <div className="p-3 bg-background-100 rounded-xl">
                <p className="text-xs text-foreground-500">{t('adminUi.columns.createdAt')}</p>
                <p className="text-sm font-medium text-foreground-900 mt-1">
                  {detail.createdAt || '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="flex-1 py-2.5 border border-background-300 rounded-xl text-sm font-medium cursor-pointer min-h-[44px]"
              >
                {t('adminUi.jobs.close')}
              </button>
              {viewMode === 'active' && (
                <button
                  type="button"
                  onClick={() => {
                    setDetail(null);
                    openEdit(detail);
                  }}
                  className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold cursor-pointer min-h-[44px]"
                >
                  {t('adminUi.jobs.edit')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)}></div>
          <div className="relative bg-background-50 border border-background-200 rounded-2xl p-6 w-full max-w-md shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-heading font-semibold text-foreground-950">
                {editing ? t('adminUi.provinces.edit') : t('adminUi.provinces.add')}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-background-100 cursor-pointer"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t('adminUi.provinces.nameLabel')} *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 min-h-[44px]"
                  placeholder={t('adminUi.provinces.namePlaceholder')}
                />
                {nameExists && (
                  <p className="text-xs text-red-500 mt-1">{t('adminUi.provinces.nameExists')}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t('adminUi.columns.code')}
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 min-h-[44px]"
                  placeholder={t('adminUi.provinces.codePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t('adminUi.columns.region')}
                </label>
                <CustomSelect
                  value={form.region}
                  options={formRegionOptions}
                  onChange={(v) => setForm({ ...form, region: v })}
                  placeholder={t('adminUi.provinces.selectRegion')}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 border border-background-300 rounded-xl text-sm font-medium cursor-pointer min-h-[44px]"
              >
                {t('adminUi.actions.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer min-h-[44px] ${
                  canSave
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'bg-background-200 text-foreground-400 cursor-not-allowed'
                }`}
              >
                {editing ? t('adminUi.jobs.saveChanges') : t('adminUi.provinces.add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {dropdownOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(null)}></div>
      )}
    </div>
  );
}
